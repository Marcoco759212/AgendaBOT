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

function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="24 de septiembre de 2026">
      <p>
        Esta Política de Privacidad explica qué información recopila AgendaBOT ("nosotros", "el Servicio"),
        cómo la usamos, con quién la compartimos y qué derechos tienes sobre ella. Aplica tanto a los
        negocios que usan nuestro panel de administración ("Cliente") como a los clientes finales que
        interactúan con el asistente de WhatsApp de un negocio que usa AgendaBOT.
      </p>

      <Section title="1. Información que recopilamos">
        <p>Recopilamos distintos tipos de información según quién interactúa con el Servicio:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-slate-900">Datos de la cuenta del negocio:</span> nombre del
            negocio, correo electrónico, contraseña (almacenada de forma cifrada), zona horaria, horario de
            atención, dirección y datos de facturación.
          </li>
          <li>
            <span className="font-medium text-slate-900">Datos del catálogo del negocio:</span> servicios
            ofrecidos, precios, duraciones e instrucciones personalizadas para el asistente de IA.
          </li>
          <li>
            <span className="font-medium text-slate-900">Datos de los clientes finales:</span> nombre,
            número de WhatsApp, historial de mensajes con el asistente y las citas que agendan, reagendan o
            cancelan.
          </li>
          <li>
            <span className="font-medium text-slate-900">Datos de uso:</span> información técnica básica
            sobre el uso del panel (por ejemplo, registros de acceso) para mantener la seguridad del
            Servicio.
          </li>
          <li>
            <span className="font-medium text-slate-900">Datos de Google Calendar:</span> si el negocio
            conecta voluntariamente su cuenta de Google Calendar, accedemos a la disponibilidad de ese
            calendario y creamos, actualizamos o eliminamos eventos correspondientes a las citas agendadas
            a través de AgendaBOT.
          </li>
        </ul>
      </Section>

      <Section title="2. Cómo usamos la información">
        <ul className="list-disc space-y-2 pl-5">
          <li>Operar el asistente de WhatsApp: entender la solicitud del cliente final, consultar disponibilidad y crear, reagendar o cancelar citas.</li>
          <li>Mostrar en el panel del negocio sus citas, clientes, servicios y reportes de analítica.</li>
          <li>Enviar recordatorios y confirmaciones relacionados con las citas.</li>
          <li>Mantener la seguridad de las cuentas y prevenir uso indebido del Servicio.</li>
          <li>Facturar la suscripción del negocio y dar soporte técnico.</li>
        </ul>
        <p>No usamos los datos de tus clientes finales para entrenar modelos de inteligencia artificial de terceros ni los vendemos a otras empresas.</p>
      </Section>

      <Section title="3. Uso de datos de Google (Google Calendar)">
        <p>
          Cuando un negocio conecta su cuenta de Google Calendar, AgendaBOT solicita acceso únicamente para
          consultar horarios disponibles y crear, actualizar o eliminar eventos correspondientes a las citas
          agendadas dentro de la plataforma. No leemos ni almacenamos eventos del calendario que no estén
          relacionados con citas creadas por AgendaBOT, y no utilizamos esta información para publicidad.
        </p>
        <p>
          El uso y la transferencia por parte de AgendaBOT de la información recibida de las APIs de Google
          se adhieren a la{' '}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 underline"
          >
            Política de Datos de Usuario de los Servicios de API de Google
          </a>
          , incluidos los requisitos de Uso Limitado (Limited Use).
        </p>
        <p>
          Puedes revocar el acceso de AgendaBOT a tu Google Calendar en cualquier momento desde el panel de
          administración de AgendaBOT o directamente desde la sección de{' '}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 underline"
          >
            permisos de aplicaciones de terceros
          </a>{' '}
          de tu cuenta de Google.
        </p>
      </Section>

      <Section title="4. Con quién compartimos información">
        <p>Compartimos información únicamente con los proveedores necesarios para operar el Servicio, entre ellos:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>El proveedor de conexión con WhatsApp (Evolution API), para enviar y recibir mensajes.</li>
          <li>Google, cuando el negocio conecta su Google Calendar, en los términos descritos arriba.</li>
          <li>Nuestro proveedor de infraestructura y base de datos, para alojar la plataforma de forma segura.</li>
          <li>Un procesador de pagos, para gestionar cobros de suscripción, cuando esta función esté disponible.</li>
        </ul>
        <p>No compartimos ni vendemos datos personales a terceros con fines publicitarios.</p>
      </Section>

      <Section title="5. Almacenamiento y seguridad">
        <p>
          Los datos se almacenan en bases de datos con acceso restringido y credenciales cifradas. Aplicamos
          medidas razonables de seguridad técnica y organizativa para proteger la información, aunque ningún
          sistema es 100% infalible.
        </p>
      </Section>

      <Section title="6. Retención de datos">
        <p>
          Conservamos los datos mientras la cuenta del negocio esté activa. Si el negocio cancela su cuenta,
          conservamos los datos por un periodo razonable para cumplir obligaciones legales o fiscales, y
          después los eliminamos o anonimizamos, salvo que la ley exija un periodo distinto.
        </p>
      </Section>

      <Section title="7. Tus derechos">
        <p>
          Si eres el negocio titular de la cuenta, puedes acceder, corregir o eliminar tus datos desde el
          panel de administración, o solicitándolo a{' '}
          <a href="mailto:marcoco.mahr@gmail.com" className="text-emerald-700 underline">
            marcoco.mahr@gmail.com
          </a>
          . Si eres un cliente final que interactuó por WhatsApp con un negocio que usa AgendaBOT, puedes
          solicitar acceso, corrección o eliminación de tus datos contactando directamente a ese negocio, o
          escribiéndonos a nosotros para canalizar tu solicitud. Estos derechos corresponden a los derechos
          de Acceso, Rectificación, Cancelación y Oposición (ARCO) reconocidos por la legislación mexicana
          de protección de datos personales.
        </p>
      </Section>

      <Section title="8. Cookies y tecnologías similares">
        <p>
          El panel de administración web puede usar almacenamiento local del navegador para mantener tu
          sesión iniciada y tus preferencias (como el tema claro u oscuro). No usamos cookies de rastreo
          publicitario de terceros.
        </p>
      </Section>

      <Section title="9. Menores de edad">
        <p>
          El Servicio está dirigido a negocios y a sus clientes finales en el contexto de agendar citas
          comerciales. No solicitamos intencionalmente datos de menores de edad más allá de la información
          mínima necesaria para agendar una cita (nombre y número de contacto).
        </p>
      </Section>

      <Section title="10. Cambios a esta política">
        <p>
          Podemos actualizar esta Política de Privacidad ocasionalmente. Publicaremos la versión vigente en
          esta misma página junto con la fecha de última actualización.
        </p>
      </Section>

      <Section title="11. Contacto">
        <p>
          Para cualquier duda sobre esta Política de Privacidad o el tratamiento de tus datos, escríbenos a{' '}
          <a href="mailto:marcoco.mahr@gmail.com" className="text-emerald-700 underline">
            marcoco.mahr@gmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}

export default PrivacyPage
