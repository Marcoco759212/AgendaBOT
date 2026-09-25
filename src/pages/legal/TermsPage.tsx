import type { ReactNode } from 'react'
import LegalLayout from './LegalLayout'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  )
}

function TermsPage() {
  return (
    <LegalLayout title="Términos y Condiciones" lastUpdated="24 de septiembre de 2026">
      <p>
        Estos Términos y Condiciones ("Términos") regulan el acceso y uso de AgendaBOT (el "Servicio"),
        una plataforma que permite a negocios gestionar la agenda de citas de sus clientes a través de
        WhatsApp asistido por inteligencia artificial, junto con un panel de administración web y, de
        forma opcional, la sincronización con Google Calendar. Al crear una cuenta o utilizar el Servicio
        aceptas estos Términos en su totalidad. Si no estás de acuerdo, no debes utilizar el Servicio.
      </p>

      <Section title="1. Quiénes ofrecen el Servicio">
        <p>
          AgendaBOT es operado por Marco Antonio Hernández Reyes, en adelante "nosotros"
          o "AgendaBOT". Para cualquier duda sobre estos Términos puedes contactarnos en{' '}
          <a href="mailto:marcoco.mahr@gmail.com" className="text-emerald-700 underline">
            marcoco.mahr@gmail.com
          </a>
          .
        </p>
      </Section>

      <Section title="2. Descripción del Servicio">
        <p>El Servicio permite a un negocio ("Cliente" o "tú"):</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Recibir y responder automáticamente mensajes de WhatsApp de sus propios clientes finales mediante un asistente de inteligencia artificial.</li>
          <li>Consultar disponibilidad, crear, reagendar y cancelar citas para los servicios que el negocio ofrece.</li>
          <li>Administrar catálogo de servicios, horarios de atención, clientes y citas desde un panel web.</li>
          <li>Sincronizar, de forma opcional, las citas creadas con una cuenta de Google Calendar conectada por el Cliente.</li>
          <li>Consultar reportes y analítica básica sobre la operación de su negocio dentro de la plataforma.</li>
        </ul>
        <p>
          El Servicio se ofrece "tal cual" y puede evolucionar con el tiempo: podemos agregar, modificar o
          retirar funciones para mejorar la plataforma, notificando cambios relevantes cuando sea razonable
          hacerlo.
        </p>
      </Section>

      <Section title="3. Registro y cuenta">
        <p>
          Para usar el Servicio debes crear una cuenta con información veraz y mantenerla actualizada. Eres
          responsable de la confidencialidad de tus credenciales de acceso y de toda actividad realizada
          desde tu cuenta. Debes notificarnos de inmediato ante cualquier uso no autorizado.
        </p>
      </Section>

      <Section title="4. Planes, precios y facturación">
        <p>
          El Servicio se ofrece mediante planes de suscripción con distintos límites de uso (número de
          conversaciones, sucursales, calendarios conectados, entre otros), descritos en la página de
          precios del sitio. Los precios se muestran en pesos mexicanos (MXN) salvo que se indique lo
          contrario y pueden actualizarse; los cambios de precio no aplican de forma retroactiva a periodos
          ya facturados. La falta de pago puede resultar en la suspensión o cancelación del acceso al
          Servicio.
        </p>
      </Section>

      <Section title="5. Uso aceptable">
        <p>Al usar el Servicio te comprometes a no:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Utilizar el Servicio para enviar mensajes no solicitados (spam), contenido fraudulento, engañoso, difamatorio o ilegal a través de WhatsApp.</li>
          <li>Intentar acceder sin autorización a cuentas, datos o sistemas de otros clientes de AgendaBOT.</li>
          <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma.</li>
          <li>Usar el Servicio de forma que infrinja las políticas de uso de WhatsApp, Evolution API, Google o cualquier proveedor externo con el que AgendaBOT se integre.</li>
        </ul>
      </Section>

      <Section title="6. Integraciones con terceros (WhatsApp y Google Calendar)">
        <p>
          El Servicio se apoya en proveedores externos para funcionar, incluyendo una API de conexión con
          WhatsApp y, opcionalmente, la API de Google Calendar cuando decides conectar tu calendario. Tu uso
          de estas integraciones también está sujeto a los términos y políticas de esos terceros. Puedes
          desconectar tu cuenta de Google Calendar en cualquier momento desde el panel de administración o
          directamente desde la configuración de tu cuenta de Google; al hacerlo, dejaremos de crear o
          modificar eventos en ese calendario.
        </p>
      </Section>

      <Section title="7. Propiedad intelectual">
        <p>
          El software, diseño, marca y demás elementos de AgendaBOT son propiedad de AgendaBOT o de sus
          licenciantes. Estos Términos no te otorgan ningún derecho de propiedad sobre la plataforma, más
          allá del derecho de uso descrito aquí. La información y contenido que tú cargas (datos de tu
          negocio, catálogo de servicios, datos de tus clientes) siguen siendo de tu propiedad.
        </p>
      </Section>

      <Section title="8. Limitación de responsabilidad">
        <p>
          El Servicio se ofrece "tal cual" y "según disponibilidad". En la máxima medida permitida por la
          ley, AgendaBOT no será responsable por daños indirectos, incidentales o consecuentes derivados del
          uso o la imposibilidad de uso del Servicio, incluyendo interrupciones causadas por proveedores
          externos (WhatsApp/Evolution API, Google, proveedores de infraestructura) fuera de nuestro control
          razonable. El asistente de inteligencia artificial puede cometer errores; recomendamos revisar
          periódicamente la información crítica (citas, precios, disponibilidad) desde el panel.
        </p>
      </Section>

      <Section title="9. Cancelación y terminación">
        <p>
          Puedes cancelar tu suscripción en cualquier momento desde el panel de administración o
          escribiéndonos. Podemos suspender o cancelar el acceso al Servicio si se incumplen estos Términos,
          notificándolo cuando sea razonablemente posible. Al terminar la relación, conservaremos los datos
          únicamente por el periodo descrito en nuestra{' '}
          <a href="/privacidad" className="text-emerald-700 underline">
            Política de Privacidad
          </a>
          .
        </p>
      </Section>

      <Section title="10. Modificaciones a estos Términos">
        <p>
          Podemos actualizar estos Términos ocasionalmente. Publicaremos la versión vigente en esta misma
          página junto con la fecha de última actualización. El uso continuado del Servicio después de una
          actualización implica la aceptación de los nuevos Términos.
        </p>
      </Section>

      <Section title="11. Ley aplicable">
        <p>
          Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, sin perjuicio de las normas
          de protección al consumidor que puedan aplicar en tu jurisdicción.
        </p>
      </Section>

      <Section title="12. Contacto">
        <p>
          Si tienes preguntas sobre estos Términos, escríbenos a{' '}
          <a href="mailto:marcoco.mahr@gmail.com" className="text-emerald-700 underline">
            marcoco.mahr@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}

export default TermsPage
