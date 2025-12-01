import { Link } from "react-router-dom";
import { ArrowLeft, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsAndConditions = () => {
  return (
    <div className="h-[100dvh]  flex flex-col bg-background">
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        <main className="max-w-4xl w-full mx-auto p-4 md:p-8">
          <h2 className="text-3xl font-bold mb-6">Términos y Condiciones</h2>
          
          <div className="space-y-6 text-muted-foreground">
            <p className="text-sm">Última actualización: {new Date().toLocaleDateString()}</p>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">1. Aceptación de los Términos</h3>
              <p>
                Al acceder y utilizar Tistos, aceptas y te comprometes a cumplir con los términos y disposiciones de este acuerdo. Si no estás de acuerdo con estos términos, por favor no utilices nuestro servicio.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">2. Cuentas de Usuario</h3>
              <p>
                Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Aceptas asumir la responsabilidad de todas las actividades que ocurran bajo tu cuenta.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">3. Normas de Contenido</h3>
              <p>
                Los usuarios no deben publicar contenido que:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Viole cualquier ley o regulación</li>
                <li>Infrinja derechos de propiedad intelectual</li>
                <li>Contenga material dañino, ofensivo o inapropiado</li>
                <li>Promueva violencia, odio o discriminación</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">4. Privacidad</h3>
              <p>
                Tu privacidad es importante para nosotros. Por favor revisa nuestra Política de Privacidad para entender cómo recopilamos, usamos y protegemos tu información personal.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">5. Propiedad Intelectual</h3>
              <p>
                Todo el contenido en Tistos, incluyendo pero no limitado a textos, gráficos, logotipos y software, es propiedad de Tistos o de sus proveedores de contenido y está protegido por leyes internacionales de derechos de autor.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">6. Terminación</h3>
              <p>
                Nos reservamos el derecho de terminar o suspender tu cuenta en cualquier momento sin previo aviso por conductas que consideremos que violan estos Términos y Condiciones.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">7. Cambios en los Términos</h3>
              <p>
                Tistos se reserva el derecho de modificar estos términos en cualquier momento. Notificaremos a los usuarios sobre cualquier cambio significativo por correo electrónico o a través de la plataforma.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-foreground mb-3">8. Contacto</h3>
              <p>
                Si tienes alguna pregunta sobre estos Términos y Condiciones, por favor contáctanos en{" "}
                <a href="mailto:legal@tistos.com" className="text-primary hover:underline">
                  legal@tistos.com
                </a>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TermsAndConditions;