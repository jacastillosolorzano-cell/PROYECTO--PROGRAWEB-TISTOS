import { Link } from "react-router-dom";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

import JavierImg from "@/components/imagenes/Javier.jpeg";
import JoaquinImg from "@/components/imagenes/Joaquin.jfif";
import MatiasImg from "@/components/imagenes/Matias.jpeg";
import MarioImg from "@/components/imagenes/Mario.jpeg";

const teamMembers = [
  { name: "Javier", lema: "Transformando ideas en código", image: JavierImg },
  { name: "Joaquin", lema: "Apasionado por el diseño intuitivo", image: JoaquinImg },
  { name: "Matias", lema: "Creando lógica que funciona", image: MatiasImg },
  { name: "Mario", lema: "Guiando al equipo hacia el éxito", image: MarioImg },
  { name: "Jesus", lema: "Amante de los pequeños detalles", image: null },
];

const AboutUs = () => {
  return (
     <div className="h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text">
              Tistos
            </h1>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto p-6 md:p-8">
          <h2 className="text-3xl font-bold mb-6">Sobre Nosotros</h2>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nuestra Misión</h3>
              <p>
                Tistos es una plataforma de videos cortos de nueva generación diseñada para inspirar la creatividad 
                y conectar comunidades en todo el mundo. Creemos en el poder de las historias auténticas 
                y la expresión creativa.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Qué Hacemos</h3>
              <p>
                Nuestra plataforma permite a los creadores compartir sus perspectivas únicas a través de videos cortos y atractivos. 
                Desde entretenimiento hasta educación, Tistos es el lugar donde nacen las tendencias y las comunidades prosperan.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Nuestros Valores</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Autenticidad y libertad creativa</li>
                <li>Contenido impulsado por la comunidad</li>
                <li>Innovación en redes sociales</li>
                <li>Entorno seguro e inclusivo</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">Contáctanos</h3>
              <p>
                ¿Tienes preguntas o comentarios? Escríbenos a{" "}
                <a href="mailto:hello@tistos.com" className="text-primary hover:underline">
                  hello@tistos.com
                </a>
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-semibold text-foreground mb-6 text-center">Nuestro Equipo</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-8 text-center">
                {teamMembers.map((member) => (
                  <div key={member.name} className="flex flex-col items-center">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={`Foto de ${member.name}`}
                        className="w-28 h-28 rounded-full object-cover border-2 border-primary/50"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-foreground">
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div className="mt-2">
                      <p className="font-semibold text-foreground">{member.name}</p>
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{member.lema}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AboutUs;