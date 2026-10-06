import type { Metadata } from 'next'
import Link from 'next/link'
import { getStoreSettings } from '@/lib/settings'
import { formatPEN } from '@/lib/format/money'
import { LEGAL_VIGENCIA, LEGAL_VIGENCIA_TEXTO, PROVEEDOR, CONTACTO } from '@/lib/legal/vigencia'
import { LegalLayout, Seccion, P, Lista, Tabla } from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | LIORA',
  description: 'Condiciones de venta de LIORA: pedidos, pagos, envíos, cambios, devoluciones y garantía, conforme a la Ley 29571.',
}

export default async function TerminosPage() {
  const settings = await getStoreSettings()
  const umbral = formatPEN(settings.free_shipping_threshold_cents, { space: true })
  const wa = settings.whatsapp_number

  return (
    <LegalLayout
      titulo="Términos y Condiciones"
      bajada="Condiciones de venta de liora.pe"
      actualizado={LEGAL_VIGENCIA}
      actualizadoTexto={LEGAL_VIGENCIA_TEXTO}
    >
      <Seccion n={1} titulo="Quiénes somos y alcance">
        <P>Estos Términos y Condiciones regulan el uso del sitio web liora.pe, el cuestionario de autocuidado y la compra de productos y kits ofrecidos por LIORA.</P>
        <P>LIORA es un nombre comercial. Los datos legales de su titular figuran en la sección 13.</P>
        <P>Canales de contacto: correo <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>, WhatsApp {wa}, y llamadas coordinadas de {CONTACTO.horario}.</P>
        <P>Las compras se rigen por estos Términos, la <Link href="/privacidad">Política de Privacidad</Link>, la <Link href="/privacidad#cookies">Política de Cookies</Link> y la normativa peruana, en especial la Ley 29571, Código de Protección y Defensa del Consumidor. Si alguna cláusula contradice una norma de protección al consumidor, prevalece la norma.</P>
      </Seccion>

      <Seccion n={2} titulo="Aceptación, usuarios y cuenta">
        <P>Al navegar en liora.pe, responder el cuestionario o realizar una compra, aceptas estos Términos en la versión vigente en ese momento.</P>
        <Lista items={[
          <><strong>Mayoría de edad.</strong> Para comprar debes ser mayor de 18 años. Los menores de edad solo pueden usar el sitio con autorización y supervisión de sus padres o tutores.</>,
          <><strong>Datos veraces.</strong> Te comprometes a brindar información verdadera, completa y actualizada, en especial tu nombre, documento de identidad, dirección y teléfono de entrega.</>,
          <><strong>Tu cuenta.</strong> Eres responsable de mantener la confidencialidad de tu contraseña y de las operaciones hechas desde tu cuenta. Si detectas un uso no autorizado, avísanos de inmediato a <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>.</>,
          <><strong>Uso indebido.</strong> LIORA puede suspender o cancelar cuentas usadas para fraude, reventa no autorizada, compras con medios de pago ajenos o cualquier uso contrario a la ley.</>,
        ]} />
      </Seccion>

      <Seccion n={3} titulo="Productos, kits y cuestionario">
        <P>LIORA ofrece productos de cuidado personal, suplementos y artículos de bienestar, de forma individual o agrupados en kits.</P>
        <P><strong>El cuestionario no es consejo médico.</strong> Las recomendaciones del cuestionario, del asistente del carrito y de nuestros canales de atención son orientativas y se basan solo en tus respuestas. No constituyen diagnóstico, tratamiento ni prescripción médica, y no reemplazan la consulta con un profesional de la salud. Si estás embarazada, en periodo de lactancia, tomas medicamentos, tienes alergias o alguna condición de salud, consulta a tu médico antes de usar cualquier producto.</P>
        <P><strong>Uso de los productos.</strong> Lee siempre la etiqueta, el inserto y las advertencias del fabricante. LIORA comercializa los productos tal como los entrega el fabricante o distribuidor autorizado, y no modifica su fórmula ni su empaque original.</P>
        <P><strong>Imágenes y descripciones.</strong> Las fotos son referenciales. El empaque, el color o la presentación pueden variar según el lote del fabricante, sin cambiar el contenido ni la calidad. Hacemos lo posible para que las descripciones sean exactas; si encuentras un error, escríbenos.</P>
        <P><strong>Kits.</strong> El contenido de cada kit se detalla en su página. Si un producto del kit no está disponible, se aplica lo indicado en la sección 5 sobre stock.</P>
      </Seccion>

      <Seccion n={4} titulo="Precios y errores de precio">
        <P>Todos los precios están en soles (S/) e incluyen IGV. El costo de envío se muestra antes de pagar, y es gratis en compras desde {umbral} según las condiciones vigentes en el sitio.</P>
        <P>El precio válido es el que figura al momento de confirmar tu pedido. Los cambios posteriores de precio no afectan pedidos ya confirmados, salvo en el caso de error evidente descrito abajo.</P>
        <P><strong>Error evidente de precio.</strong> Aunque revisamos nuestro catálogo, puede ocurrir un error tipográfico o de sistema que muestre un precio claramente desproporcionado frente al valor real del producto. Por ejemplo, un protector solar de S/ 197.90 publicado a S/ 1.97, o un kit publicado a S/ 0. En ese caso:</P>
        <Lista ordenada items={[
          'Te avisaremos por correo o WhatsApp dentro de las 48 horas de recibido tu pedido, y antes de despacharlo.',
          'Te daremos a elegir entre comprar al precio correcto o cancelar el pedido.',
          'Si cancelas, o si no respondes en 48 horas, te devolveremos el 100% de lo pagado por el mismo medio de pago, sin costo para ti.',
        ]} />
        <P>No se considera error evidente una diferencia de precio razonable, una promoción vigente ni una rebaja que pudiera parecer real a un consumidor razonable. En esos casos, LIORA respeta el precio publicado.</P>
        <P><strong>Plazos de reembolso.</strong> El reembolso se ordena dentro de los 7 días de cancelado el pedido. El tiempo en que se refleja en tu cuenta depende de tu banco o billetera digital, y puede tomar hasta 30 días en tarjetas de crédito.</P>
      </Seccion>

      <Seccion n={5} titulo="Stock y disponibilidad">
        <P>Todos los productos están sujetos a disponibilidad. Nuestro inventario se actualiza constantemente, pero por ventas simultáneas, fallas del sistema o problemas con proveedores, un producto puede agotarse después de que hiciste tu pedido.</P>
        <P>Si esto ocurre, te avisaremos por correo o WhatsApp dentro de las 48 horas y podrás elegir entre:</P>
        <Lista items={[
          'Esperar la reposición, si tenemos una fecha estimada.',
          'Reemplazarlo por un producto equivalente, que te propondremos sin costo adicional.',
          'Envío parcial, recibiendo el resto del pedido y el reembolso del producto faltante.',
          'Cancelar el pedido completo, con reembolso del 100% de lo pagado, incluido el envío.',
        ]} />
        <P>Nunca reemplazaremos un producto sin tu aceptación expresa. Si no respondes en 48 horas, reembolsaremos el producto faltante y enviaremos el resto.</P>
        <P><strong>Kits con un producto agotado.</strong> Si falta un producto de un kit, aplican las mismas opciones. En caso de envío parcial, reembolsamos el valor proporcional de ese producto dentro del kit.</P>
      </Seccion>

      <Seccion n={6} titulo="Pedidos, confirmación y pagos">
        <P>Tu pedido queda confirmado cuando recibes el correo de confirmación con tu código de pedido, después de que el pago fue aprobado.</P>
        <P><strong>Medios de pago.</strong> Por ahora aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express. Los pagos se procesan de forma segura a través de Stripe y aparecen en tu estado de cuenta a nombre de LIORA. LIORA no almacena los datos completos de tu tarjeta. Próximamente habilitaremos Yape, Plin y transferencia bancaria, y lo anunciaremos en el sitio.</P>
        <P><strong>Validación de pedidos.</strong> Para prevenir fraudes, podemos pedirte que confirmes tu identidad o el titular del medio de pago. Si no logramos validarlo en 48 horas, podemos cancelar el pedido y reembolsar lo pagado.</P>
        <P><strong>Cancelación por tu parte.</strong> Puedes cancelar sin costo dentro de las 24 horas de confirmado tu pedido, siempre que aún no haya sido despachado, escribiendo por WhatsApp o a <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> con tu código de pedido. Pasado ese plazo, el pedido ya no puede cancelarse, salvo en los casos de las secciones 4, 5 y 7.</P>
        <P><strong>Comprobantes.</strong> Emitimos boleta o factura electrónica según lo indiques al comprar. Para factura necesitas brindar tu RUC antes de pagar, porque no se puede cambiar una boleta emitida por una factura.</P>
      </Seccion>

      <Seccion n={7} titulo="Envíos y entregas">
        <P>Enviamos a todo el Perú. Los plazos se cuentan desde la confirmación del pago y son estimados.</P>
        <Tabla
          cabeceras={['Destino', 'Plazo estimado', 'Costo']}
          filas={[
            ['Lima Metropolitana', '36 a 48 horas', `Gratis desde ${umbral}; si no, según tarifa mostrada al pagar`],
            ['Provincias', '3 a 5 días hábiles', `Gratis desde ${umbral}; si no, según tarifa mostrada al pagar`],
            ['Zonas de difícil acceso', 'Se informa al confirmar', 'Se informa al confirmar'],
          ]}
        />
        <P><strong>Seguimiento.</strong> Enviamos el código de seguimiento a tu correo y WhatsApp.</P>
        <P><strong>Retrasos.</strong> Enviamos con las empresas de courier Shalom y Olva Courier. Los plazos son estimados y pueden variar por decisión o requerimientos operativos de estas empresas, así como por feriados, campañas de alta demanda, clima, bloqueos de vías u otras causas ajenas a LIORA. Si tu pedido se retrasa, te avisaremos y podrás cancelarlo con reembolso total si aún no fue entregado.</P>
        <P><strong>Cambio de dirección.</strong> Solo puede hacerse antes del despacho.</P>
        <P><strong>Entrega fallida.</strong> El courier intentará entregar dos veces. Si no hay nadie para recibir o la dirección es incorrecta, coordinaremos contigo un nuevo envío, que puede tener un costo adicional.</P>
        <P><strong>Revisa al recibir.</strong> Al recibir, verifica que el paquete esté cerrado y sin daños. Cualquier observación sobre el estado del paquete debe reportarse con fotos dentro de las 24 horas de recibido. Para aceptarla, el producto debe estar en perfecto estado, sin uso, sin modificaciones y sin maltrato posterior a la entrega.</P>
      </Seccion>

      <Seccion n={8} titulo="Cambios, devoluciones y garantía">
        <P>Si un producto llega dañado, vencido, defectuoso o distinto al pedido, lo cambiamos o reembolsamos sin costo para ti. Esta garantía legal aplica siempre, según el Código de Protección y Defensa del Consumidor.</P>
        <P><strong>Cómo reportarlo.</strong> Escríbenos dentro de los 2 días calendario de recibido el pedido, con tu código de pedido y fotos del producto y del empaque. El producto debe estar sin uso, sin modificaciones y en el mismo estado en que lo recibiste. Si un defecto solo puede detectarse al usar el producto, aplica la garantía legal que reconoce el Código. Nosotros coordinamos el recojo o el envío del reemplazo.</P>
        <P><strong>No aceptamos devoluciones por cambio de opinión.</strong> Por tratarse de productos de cuidado personal, salud e higiene, solo aceptamos cambios o reembolsos cuando el producto llega dañado, vencido, defectuoso o distinto al pedido. Te recomendamos revisar bien la descripción de cada producto y kit antes de comprar.</P>
        <P><strong>Reembolso.</strong> Una vez recibido y revisado el producto, ordenamos el reembolso dentro de los 7 días, por el mismo medio de pago usado en la compra.</P>
      </Seccion>

      <Seccion n={9} titulo="Promociones, cupones y descuentos">
        <P>Cada promoción indica su vigencia (fecha de inicio y fin), el stock mínimo disponible y sus condiciones de uso en la página del producto o en la publicación de la campaña.</P>
        <Lista items={[
          'Los cupones son personales, no son canjeables por dinero y no son acumulables con otras promociones, salvo que se indique lo contrario.',
          'Un cupón se aplica una vez por cliente y por pedido, salvo que la campaña diga otra cosa.',
          'Si devuelves un producto comprado con descuento, el reembolso corresponde al monto realmente pagado.',
          'LIORA puede anular cupones usados de forma fraudulenta, por ejemplo mediante cuentas múltiples.',
        ]} />
      </Seccion>

      <Seccion n={10} titulo="Reclamos y atención al cliente">
        <P>Distinguimos entre reclamo y queja, conforme a la normativa de Indecopi:</P>
        <Lista items={[
          <><strong>Reclamo:</strong> disconformidad con un producto o servicio adquirido.</>,
          <><strong>Queja:</strong> disconformidad con la atención recibida, que no se relaciona con el producto.</>,
        ]} />
        <P>Puedes registrar tu reclamo o queja escribiéndonos a <a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a> o por WhatsApp al {wa}. Recibirás una copia en tu correo y responderemos en un plazo máximo de 15 días hábiles. Presentar un reclamo no impide acudir a otras vías de solución ni interponer una denuncia ante Indecopi.</P>
        <P>Para consultas generales, escríbenos por los mismos canales o visita <Link href="/contacto">la página de contacto</Link>.</P>
      </Seccion>

      <Seccion n={11} titulo="Privacidad y cookies">
        <P>El tratamiento de tus datos personales se rige por la <Link href="/privacidad">Política de Privacidad</Link>, conforme a la Ley 29733, y el uso de cookies por la <Link href="/privacidad#cookies">Política de Cookies</Link>. Ambas forman parte de estos Términos.</P>
      </Seccion>

      <Seccion n={12} titulo="Otras condiciones">
        <P><strong>Propiedad intelectual.</strong> La marca LIORA, el logo, los textos, el diseño del sitio, el cuestionario y los nombres de los kits pertenecen a LIORA. No pueden copiarse ni usarse con fines comerciales sin autorización escrita. Las marcas de los productos que vendemos pertenecen a sus respectivos fabricantes.</P>
        <P><strong>Responsabilidad.</strong> LIORA responde por la idoneidad de los productos que vende, según la ley. No responde por el uso de un producto distinto al indicado por el fabricante, por reacciones derivadas de no seguir sus advertencias, ni por interrupciones del sitio causadas por terceros o fuerza mayor.</P>
        <P><strong>Opiniones y contenido de usuarios.</strong> Las reseñas y testimonios que publiques deben ser reales y respetuosos. Podemos retirar contenido ofensivo, falso o que infrinja derechos de terceros.</P>
        <P><strong>Cambios a estos Términos.</strong> Podemos actualizar estos Términos. La versión vigente siempre estará en liora.pe/terminos con su fecha de actualización. Los cambios no afectan pedidos ya confirmados.</P>
        <P><strong>Ley aplicable.</strong> Estos Términos se rigen por las leyes de la República del Perú. Cualquier controversia se resolverá ante Indecopi o los tribunales competentes del Perú, sin perjuicio de los derechos que la ley reconoce al consumidor.</P>
      </Seccion>

      <Seccion n={13} titulo="Información legal del proveedor">
        {/* El negocio pidió que estos datos vayan en letra pequeña, como en los contratos.
            Se reducen y atenúan, pero no por debajo de lo legible: la ley exige que el
            proveedor sea identificable. US-005 · AC-005-02. */}
        <p
          data-legal="proveedor"
          style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.62, margin: 0 }}
        >
          {PROVEEDOR.nombreComercial} es un nombre comercial de {PROVEEDOR.titular},{' '}
          {PROVEEDOR.condicion}, con RUC {PROVEEDOR.ruc} y domicilio fiscal en {PROVEEDOR.domicilioFiscal}.
        </p>
      </Seccion>
    </LegalLayout>
  )
}
