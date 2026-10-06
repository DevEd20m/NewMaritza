import type { Metadata } from 'next'
import Link from 'next/link'
import { PrivacySettingsButton } from '@/components/analytics/PrivacySettingsButton'
import { LEGAL_VIGENCIA, LEGAL_VIGENCIA_TEXTO, PROVEEDOR, CONTACTO } from '@/lib/legal/vigencia'
import { LegalLayout, Seccion, P, Tabla } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacidad y cookies | LIORA',
  description: 'Cómo LIORA trata tus datos personales conforme a la Ley 29733, qué cookies usa y cómo ejercer tus derechos ARCO.',
}

export default function PrivacidadPage() {
  return (
    <LegalLayout
      titulo="Privacidad y cookies"
      bajada="Cómo tratamos tus datos"
      actualizado={LEGAL_VIGENCIA}
      actualizadoTexto={LEGAL_VIGENCIA_TEXTO}
    >
      <Seccion titulo="Política de Privacidad" id="privacidad">
        <P>LIORA trata tus datos personales conforme a la Ley 29733, Ley de Protección de Datos Personales, y su Reglamento. El responsable del banco de datos es el titular de LIORA indicado en la <Link href="/terminos">sección 13 de los Términos</Link>.</P>
      </Seccion>

      <Seccion titulo="Datos que recopilamos y para qué">
        <Tabla
          cabeceras={['Datos', 'Finalidad', '¿Es obligatorio?']}
          filas={[
            ['Nombre, DNI, correo, teléfono, dirección', 'Procesar tu pedido, entregar y emitir comprobante', 'Sí, para comprar'],
            ['Datos de pago', 'Cobrar el pedido (los procesa la pasarela de pagos)', 'Sí, para comprar'],
            ['Respuestas del cuestionario', 'Recomendarte productos y kits', 'No'],
            ['Historial de compras y navegación', 'Mejorar el sitio y personalizar recomendaciones', 'No'],
            ['Correo y teléfono para marketing', 'Enviarte ofertas y novedades', 'No, requiere tu aceptación aparte'],
          ]}
        />
        <P><strong>Datos sensibles del cuestionario.</strong> Algunas respuestas pueden revelar información de salud, como problemas de sueño, piel, digestión o estrés. Estos son datos sensibles: solo los tratamos si das tu consentimiento expreso marcando la casilla correspondiente antes de enviar el cuestionario. Los usamos únicamente para recomendarte productos, no los vendemos ni los usamos para publicidad de terceros.</P>
      </Seccion>

      <Seccion titulo="Qué registramos de tu navegación, y qué no">
        <P>Registramos pantallas visitadas, tiempo activo y acciones sobre elementos de la interfaz. <strong>No</strong> registramos contraseñas, contenido escrito en formularios, datos de tarjeta ni coordenadas del cursor.</P>
        <P>Los datos de identidad solo se vinculan internamente cuando voluntariamente inicias sesión, completas un cuestionario, solicitas información o realizas una compra. Google Analytics y Amplitude reciben eventos sanitizados e identificadores opacos, nunca nombres, correos, teléfonos o direcciones.</P>
        <P>Los recorridos detallados se conservan durante 180 días y después se eliminan automáticamente. Puedes desactivar la analítica cuando quieras:</P>
        <div><PrivacySettingsButton /></div>
      </Seccion>

      <Seccion titulo="Con quién compartimos tus datos">
        <P>Solo con los proveedores necesarios para operar la tienda:</P>
        <Tabla
          cabeceras={['Proveedor', 'Para qué']}
          filas={[
            ['Stripe', 'Procesar los pagos'],
            ['Shalom y Olva Courier', 'Entregar los pedidos'],
            ['Vercel', 'Alojar el sitio'],
            ['Supabase', 'Base de datos y almacenamiento'],
            ['Resend', 'Enviar los correos de tu pedido'],
            ['Google Analytics y Amplitude', 'Medir el uso del sitio'],
          ]}
        />
        <P>Algunos de estos proveedores pueden almacenar datos fuera del Perú, con las garantías que exige la ley. También compartimos datos cuando una autoridad lo requiera legalmente.</P>
      </Seccion>

      <Seccion titulo="Cuánto tiempo los conservamos">
        <P>Mientras tengas una cuenta activa o mientras sea necesario para la finalidad. Los datos de compras se conservan el tiempo que exigen las normas tributarias. Las respuestas del cuestionario se eliminan si retiras tu consentimiento.</P>
      </Seccion>

      <Seccion titulo="Tus derechos (ARCO)">
        <P>Puedes acceder, rectificar, cancelar u oponerte al tratamiento de tus datos, y revocar tu consentimiento en cualquier momento, escribiendo a <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> con copia de tu DNI. Responderemos dentro de los plazos legales. Si no estás conforme, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.</P>
        <P><strong>Seguridad.</strong> Aplicamos medidas técnicas y organizativas para proteger tus datos contra acceso no autorizado, pérdida o alteración.</P>
        <P><strong>Menores de edad.</strong> No recopilamos intencionalmente datos de menores de 18 años sin autorización de sus padres o tutores.</P>
      </Seccion>

      <Seccion titulo="Política de Cookies" id="cookies">
        <P>Usamos cookies para que el sitio funcione, recordar tu carrito y entender cómo se usa liora.pe. Puedes gestionarlas desde el botón de preferencias de esta página o desde el enlace del pie.</P>
        <Tabla
          cabeceras={['Tipo', 'Para qué sirve', '¿Se puede desactivar?']}
          filas={[
            ['Necesarias', 'Inicio de sesión, carrito, pago y seguridad', 'No, sin ellas el sitio no funciona'],
            ['Analíticas', 'Medir visitas y mejorar el sitio', 'Sí'],
            ['Marketing', 'Mostrarte anuncios relevantes en redes sociales', 'Sí'],
          ]}
        />
        <P>Solo activamos las cookies analíticas y de marketing si las aceptas. También puedes borrarlas o bloquearlas desde la configuración de tu navegador.</P>
      </Seccion>

      <Seccion titulo="Responsable del tratamiento">
        <p data-legal="proveedor" style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.62, margin: 0 }}>
          {PROVEEDOR.nombreComercial} es un nombre comercial de {PROVEEDOR.titular},{' '}
          {PROVEEDOR.condicion}, con RUC {PROVEEDOR.ruc} y domicilio fiscal en {PROVEEDOR.domicilioFiscal}.
        </p>
      </Seccion>
    </LegalLayout>
  )
}
