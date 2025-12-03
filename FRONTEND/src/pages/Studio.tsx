import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { io } from 'socket.io-client';
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCheck, GraduationCap, Flame, Gift, Edit, Trash2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import StreamerProgress from "@/components/StreamerProgress";
import OverlayAnimator from "@/components/OverlayAnimator";
import { BACKEND_URL } from "@/config"

const posts = [
  {
    id: 1,
    usuario: "streamer1",
    texto: "¡Bienvenidos al directo! #stream #tistos",
    vistas: "3.5M",
    likes: "258.7K",
    categoria: "Trending",
    img: "https://picsum.photos/seed/stream1/80/80",
  },
  {
    id: 2,
    usuario: "streamer2",
    texto: "Hoy hablamos de tecnología 🚀 #tech",
    vistas: "6.4M",
    likes: "446.6K",
    categoria: "Recommended",
    img: "https://picsum.photos/seed/stream2/80/80",
  },
];

const Studio = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("inspiracion");
  const [regalos, setRegalos] = useState<any[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [nuevoRegalo, setNuevoRegalo] = useState({ nombre: "", costo: "", puntos: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Obtener el usuario actual del localStorage
  const usuarioActual = JSON.parse(localStorage.getItem("tistos_current_user") || "{}")
  const id_streamer = usuarioActual.id_usuario

  // Cambiar rol a Streamer y cargar regalos al montar el componente
  useEffect(() => {
    const ensureStreamerAndLoad = async () => {
      if (!id_streamer) return
      try {
        // Consultar al backend si el usuario existe y es STREAMER
        const check = await fetch(`${BACKEND_URL}/usuarios/${id_streamer}`)
        if (check.status === 200) {
          const u = await check.json()
          if (u.rol === 'STREAMER') {
            await cargarRegalos()
            return
          }
        }

        // Si no es streamer o no existe, intentar cambiar rol (backend maneja creación/validación)
        await cambiarARolStreamer()
        await cargarRegalos()
      } catch (err) {
        console.error('Error validando streamer:', err)
        toast.error('No fue posible verificar el streamer')
      }
    }

    ensureStreamerAndLoad()
  }, [id_streamer])

  // Conectar Socket.IO y escuchar regalos en tiempo real
  useEffect(() => {
    if (!id_streamer) return;
    const socket = io(BACKEND_URL, { autoConnect: true });

    socket.on('connect', () => {
      console.log('Socket conectado (frontend):', socket.id);
      socket.emit('join_streamer_room', id_streamer);
    });

    socket.on('gift_received', (data: any) => {
      // Disparar evento global para OverlayAnimator
      const detail = {
        type: 'gift',
        from: data.espectador_nombre || data.id_espectador,
        giftName: data.regalo?.nombre || data.id_regalo || 'Regalo',
        points: data.puntos_otorgados || data.puntos || 0,
        multiplier: data.cantidad || 1
      };
      window.dispatchEvent(new CustomEvent('tistos:overlay', { detail }));
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado (frontend)')
    })

    return () => {
      socket.disconnect();
    }
  }, [id_streamer]);

  const cambiarARolStreamer = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/usuarios/${id_streamer}/rol`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: "STREAMER" })
      })

      if (resp.status === 200) {
        const usuarioActualizado = await resp.json()
        // Actualizar el usuario en localStorage
        localStorage.setItem("tistos_current_user", JSON.stringify(usuarioActualizado))
        toast.success("¡Bienvenido al modo Streamer!")
      } else {
        toast.error("Error al cambiar al modo streamer")
      }
    } catch (error) {
      toast.error("Error al cambiar al modo streamer")
      console.error(error)
    }
  }

  const cargarRegalos = async () => {
    try {
      setLoading(true)
      const resp = await fetch(`${BACKEND_URL}/regalos/streamer/${id_streamer}`)
      if (resp.status === 200) {
        const data = await resp.json()
        setRegalos(data)
      }
    } catch (error) {
      toast.error("Error al cargar los regalos")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Simula recibir un regalo
  const recibirRegalo = (nombre: string, usuario: string) => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
  };

  // Crear o editar regalo
  const handleSaveRegalo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRegalo.nombre || !nuevoRegalo.costo || !nuevoRegalo.puntos) {
      toast.error("Completa todos los campos")
      return
    }

    try {
      if (editId) {
        // Editar regalo existente
        const resp = await fetch(`${BACKEND_URL}/regalos/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nuevoRegalo.nombre,
            costo_monedas: Number(nuevoRegalo.costo),
            puntos_otorgados: Number(nuevoRegalo.puntos)
          })
        })

        if (resp.status === 200) {
          toast.success("Regalo actualizado")
          setEditId(null)
          await cargarRegalos()
        } else {
          toast.error("Error al actualizar el regalo")
        }
      } else {
        // Crear nuevo regalo
        const resp = await fetch(`${BACKEND_URL}/regalos/crear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nuevoRegalo.nombre,
            costo_monedas: Number(nuevoRegalo.costo),
            puntos_otorgados: Number(nuevoRegalo.puntos),
            id_streamer
          })
        })

        if (resp.status === 200) {
          toast.success("Regalo creado")
          await cargarRegalos()
        } else {
          toast.error("Error al crear el regalo")
        }
      }
      setNuevoRegalo({ nombre: "", costo: "", puntos: "" })
    } catch (error) {
      toast.error("Error al guardar el regalo")
      console.error(error)
    }
  }

  // Editar regalo
  const handleEdit = (regalo: any) => {
    setEditId(regalo.id_regalo)
    setNuevoRegalo({ 
      nombre: regalo.nombre, 
      costo: regalo.costo_monedas.toString(), 
      puntos: regalo.puntos_otorgados.toString() 
    })
  }

  // Eliminar regalo
  const handleDelete = async (id_regalo: string) => {
    try {
      const resp = await fetch(`${BACKEND_URL}/regalos/${id_regalo}`, {
        method: "DELETE"
      })

      if (resp.status === 200) {
        toast.success("Regalo eliminado")
        await cargarRegalos()
      } else {
        toast.error("Error al eliminar el regalo")
      }
    } catch (error) {
      toast.error("Error al eliminar el regalo")
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-background relative pb-20">
      {/* Botón de regresar */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 left-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h2 className="text-3xl font-bold text-center pt-8 mb-6">Tistos Studio</h2>

      <OverlayAnimator />
      <StreamerProgress />
      {/* Estadísticas */}
      <div className="max-w-xl mx-auto bg-card rounded-xl p-6 mb-6 shadow flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">Estadísticas</span>
          <Button variant="link" size="sm">Ver todo</Button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="font-bold text-xl">0</span>
            <div className="text-xs text-muted-foreground">Visualizaciones</div>
            <div className="text-xs text-muted-foreground">0% 7d</div>
          </div>
          <div>
            <span className="font-bold text-xl">0</span>
            <div className="text-xs text-muted-foreground">Seguidores netos</div>
            <div className="text-xs text-muted-foreground">0% 7d</div>
          </div>
          <div>
            <span className="font-bold text-xl">0</span>
            <div className="text-xs text-muted-foreground">Me gusta</div>
            <div className="text-xs text-muted-foreground">0% 7d</div>
          </div>
        </div>
      </div>
      
      {/* Herramientas */}
      <div className="max-w-xl mx-auto flex justify-between items-center mb-3 gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2">
          <UserCheck className="w-4 h-4" /> Verificar cuenta
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-2">
          <GraduationCap className="w-4 h-4" /> Academia de creadores
        </Button>
        
      </div>
      <div className="max-w-xl mx-auto flex justify-between items-center mb-6 gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-2">
          <Flame className="w-4 h-4" /> Promocionar
        </Button>
      </div>

      {/* Tabs */}
      <div className="max-w-xl mx-auto flex mb-4 gap-2">
        <Button
          variant={tab === "monetizacion" ? "secondary" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setTab("monetizacion")}
        >
          Monetización
        </Button>
      </div>

      {/* Filtros */}
      <div className="max-w-xl mx-auto flex gap-2 mb-6">
        <Button variant="outline" size="sm">Trending</Button>
        <Button variant="outline" size="sm">Recommended</Button>
      </div>

      {/* Lista de posts simulados */}
      <div className="max-w-xl mx-auto mb-8">
        {posts.map((post, idx) => (
          <div key={post.id} className="flex items-center gap-3 py-3 border-b border-border">
            <span className="font-bold text-primary">{idx + 1}</span>
            <img src={post.img} alt={post.usuario} className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{post.texto}</div>
              <div className="text-xs text-muted-foreground flex gap-2">
                <span>👁️ {post.vistas}</span>
                <span>❤️ {post.likes}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => recibirRegalo("Rosa", post.usuario)}>
              <Gift className="w-5 h-5 text-primary" />
            </Button>
          </div>
        ))}
      </div>

      {/* Gestión de regalos */}
      <div className="max-w-xl mx-auto bg-card rounded-xl p-6 mb-8">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" /> Regalos del canal
        </h3>
        <form onSubmit={handleSaveRegalo} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nombre"
            className="border rounded  w-15 bg-background"
            value={nuevoRegalo.nombre}
            onChange={e => setNuevoRegalo({ ...nuevoRegalo, nombre: e.target.value })}
          />
          <input
            type="number"
            placeholder="Costo"
            className="border rounded w-12 bg-background"
            value={nuevoRegalo.costo}
            onChange={e => setNuevoRegalo({ ...nuevoRegalo, costo: e.target.value })}
          />
          <input
            type="number"
            placeholder="Puntos"
            className="border rounded px-2 py-1 w-20 bg-background"
            value={nuevoRegalo.puntos}
            onChange={e => setNuevoRegalo({ ...nuevoRegalo, puntos: e.target.value })}
          />
          <Button type="submit" size="sm" variant="secondary">
            {editId ? <Edit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          </Button>
        </form>
        <div>
          {loading ? (
            <p className="text-muted-foreground">Cargando regalos...</p>
          ) : regalos.length === 0 ? (
            <p className="text-muted-foreground">No hay regalos. Crea uno para comenzar.</p>
          ) : (
            regalos.map(regalo => (
              <div key={regalo.id_regalo} className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{regalo.nombre}</span>
                <span className="text-xs text-muted-foreground">Costo: {regalo.costo_monedas}</span>
                <span className="text-xs text-muted-foreground">Puntos: {regalo.puntos_otorgados}</span>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(regalo)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(regalo.id_regalo)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlay animado de regalo recibido */}
      {showOverlay && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-primary text-white px-8 py-6 rounded-2xl shadow-lg animate-bounce text-center text-xl font-bold">
            ¡Has recibido un regalo!
            <div className="mt-2 text-base">🎁 Gracias por tu apoyo</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Studio;