import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxe × Odylic — Una plataforma agéntica para travel designers",
  description:
    "Para que ningún ITD tenga que elegir entre independencia y respaldo. Para que esa frase sea más que un eslogan.",
};

export default function OdylicPitchPage() {
  return (
    <main className="pitch">
      {/* -------------------------------------------------- HERO */}
      <section className="pitch-hero">
        <div className="pitch-hero-mark">
          Luxe<sup>AI</sup>
        </div>
        <div className="pitch-hero-mid">
          <div className="pitch-hero-eyebrow">
            Una propuesta para Odylic · Mayo 2026
          </div>
          <h1 className="pitch-hero-h1">
            Diseñar viajes extraordinarios <em>no debería sentirse</em> como
            administrar un negocio.
          </h1>
          <p className="pitch-hero-sub">
            Luxe es la plataforma agéntica que trabaja junto a cada Independent
            Travel Designer. Los agentes investigan, redactan, vigilan y
            ordenan. La travel designer decide, firma y se conecta con el
            cliente.
          </p>
        </div>
        <div className="pitch-hero-quote">
          <em>"Diseñamos viajes con intención, criterio y alma."</em>
          <span className="pitch-hero-cite">— Odylic</span>
        </div>
      </section>

      <Divider />

      {/* -------------------------------------------------- PROBLEM */}
      <Section number="01" eyebrow="El estado actual">
        <h2 className="pitch-h2">
          La parte aburrida del lujo se está comiendo el lujo.
        </h2>
        <div className="pitch-grid-2">
          <p className="pitch-body">
            Cada propuesta empieza con doce horas de búsqueda mecánica antes
            del primer trazo creativo. Vuelos en seis pestañas. Hoteles
            reabiertos en otra. Restaurantes guardados en notas. El mismo
            cuestionario llenado tres veces, en tres formatos. Los upgrades y
            amenities perdidos en hilos de correo. Los reportes mensuales
            armados a mano cada vez.
          </p>
          <p className="pitch-body">
            Cada ITD termina diseñando dos veces: el viaje, y la operación
            invisible que lo soporta. Y cada vez que entra una nueva ITD a la
            red, ese trabajo invisible se duplica. Es una carga que escala
            linealmente con el equipo, mientras que el margen escala mucho más
            despacio.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------- WHAT IS LUXE */}
      <Section number="02" eyebrow="Qué es Luxe">
        <h2 className="pitch-h2">
          Una plataforma donde <em>los agentes proponen, los humanos
          aprueban</em>.
        </h2>
        <p className="pitch-lede">
          Cuatro agentes especializados — vuelos, hoteles, itinerario, cena —
          investigan en paralelo cada vez que se abre un viaje. Devuelven
          opciones rankeadas con justificación: por qué este vuelo, por qué
          este hotel, por qué este horario. Nada se reserva sin que la ITD
          haga click en aprobar.
        </p>

        <div className="pitch-mock pitch-mock-agentlog">
          <div className="pitch-mock-label">Trip workspace · agent log</div>
          <ul className="pitch-mock-log">
            <li>
              <span className="pml-avatar pml-orch">✦</span>
              <span className="pml-body">
                <em>Hotel Agent</em> recomienda{" "}
                <em>Aman Tokyo, Suite Premier Deluxe</em> sobre 3 alternativas
                — el cliente prefiere chains boutique, pidió piscina interior,
                budget cómodo en este rango.
              </span>
              <span className="pml-time">14:23</span>
            </li>
            <li>
              <span className="pml-avatar pml-sub">⚙</span>
              <span className="pml-body">
                <em>Flight Agent</em> propone <em>JL011 + JL010</em> en F
                clase, escalas mínimas, llegada matinal en Narita para tu
                preferencia de check-in temprano.
              </span>
              <span className="pml-time">14:24</span>
            </li>
            <li className="pml-pending">
              <span className="pml-avatar pml-orch">✦</span>
              <span className="pml-body">
                Esperando aprobación de la ITD para confirmar reserva.
              </span>
              <span className="pml-time">14:24</span>
            </li>
          </ul>
        </div>

        <p className="pitch-body">
          La ITD lee, ajusta, aprueba. El agente emite la confirmación, lo
          registra en el itinerario, lo suma al presupuesto comprometido, y
          actualiza el activity log del cliente. Todo lo que solía vivir en
          memoria personal ahora vive con el cliente, indexable, recuperable,
          compartible.
        </p>
      </Section>

      {/* -------------------------------------------------- ITD VIEW */}
      <Section number="03" eyebrow="Para la ITD">
        <h2 className="pitch-h2">
          Tu cartera, tu criterio, tu cliente. Pero <em>nunca sola</em>.
        </h2>

        <FeatureCard title="Inteligencia de cliente, viva.">
          <p>
            El CRM no es una agenda. Es una capa de inteligencia que aprende
            del comportamiento del cliente y le susurra a la ITD qué hacer
            antes de que el cliente lo pida.{" "}
            <em>Next Trip Signal</em> predice cuándo está listo para volver a
            viajar.{" "}
            <em>Spend Pattern</em> muestra si está subiendo de ticket o si su
            techo está cerca.{" "}
            <em>Risk Flag</em> avisa si la relación se está enfriando o si
            falta un referido.
          </p>
        </FeatureCard>

        <FeatureCard title="Brief de 60 segundos antes de cada llamada.">
          <p>
            Treinta segundos antes de marcar, Luxe entrega un resumen
            ejecutivo del cliente: últimos viajes, preferencias declaradas,
            ticket promedio, lo que dijo en la última conversación, y un
            sugerido de tres temas para abrir. La llamada de descubrimiento
            deja de ser <em>descubrimiento</em>: es una verificación
            elegante.
          </p>
        </FeatureCard>

        <FeatureCard title="Compositor de outreach con voz consistente.">
          <p>
            "Escribe a Marcela proponiendo Marruecos en octubre, mencionando
            su afinidad con riads boutique y la fecha de aniversario que
            registramos." Luxe redacta el primer borrador en un español que
            suena a tu marca, no a una IA cualquiera. La ITD edita y manda.
            La voz queda coherente, sin importar quién la firme.
          </p>
        </FeatureCard>

        <FeatureCard title="Document Vault con extracción Vision.">
          <p>
            Foto de un pasaporte, captura de un voucher, PDF de una visa —
            todo entra y se clasifica solo. Gemini Vision lee los campos
            estructurados (número, nacionalidad, fecha de expiración,
            booking reference, total) y los deja como pills filtrables. Los
            vencimientos próximos suben a la superficie como alertas — los
            pasaportes nunca más se vencen entre las grietas.
          </p>
        </FeatureCard>

        <FeatureCard title="Propuestas editoriales en un click.">
          <p>
            La narrativa día a día, los anchors del viaje, los ornamentos
            tipográficos, las imágenes de hero — todo brandeado Odylic, todo
            consistente, todo descargable como PDF de calidad imprimible o
            como página web compartible con clave. La calidad de la
            propuesta deja de depender de qué tan buena fue la última noche
            del ITD frente a Canva.
          </p>
        </FeatureCard>

        <FeatureCard title="Tracking de margen con FX bloqueado.">
          <p>
            Cada línea del viaje guarda su tarifa neta del proveedor y el
            precio final al cliente, en cualquier moneda. Al confirmar, el
            tipo de cambio se bloquea — los reportes históricos no se mueven
            cuando el dólar se mueve. Multi-currency nativo: USD, EUR, CLP,
            BRL, JPY, GBP, MXN... La ITD ve su comisión proyectada en tiempo
            real, sin armar planillas.
          </p>
        </FeatureCard>
      </Section>

      {/* -------------------------------------------------- ODYLIC VIEW */}
      <Section number="04" eyebrow="Para Odylic">
        <h2 className="pitch-h2">
          Una vista del negocio, no <em>una suma de Excels</em>.
        </h2>

        <div className="pitch-grid-3">
          <BulletCard
            label="Pipeline de cartera"
            body="Kanban en vivo de cada cliente: lead, discovery, proposing, booked, traveling, returning. Sabes en qué etapa está cada relación de cada ITD, sin pedir reportes."
          />
          <BulletCard
            label="Comisiones automáticas"
            body="El esquema 50/50 — y los tiers de volumen — se aplican línea por línea sobre el margen real. Cada ITD ve su pipeline de cobros; Odylic ve los suyos. Sin planillas mensuales."
          />
          <BulletCard
            label="Reportes en moneda de Odylic"
            body="Cada ITD trabaja en la moneda que le sirva. Los rollups suben a la moneda de reporte de Odylic, con el FX correcto al cierre. Margin por destino, por mes, por ITD."
          />
          <BulletCard
            label="Brand consistente"
            body="Las propuestas, los emails, las páginas compartibles, los PDFs — todo se diseña una vez y queda dentro de la plataforma. Cada ITD nuevo entra con la calidad editorial completa el día uno."
          />
          <BulletCard
            label="Capa proactiva"
            body="Un agente que vigila pasaportes que vencen, vuelos modificados, ventanas de re-booking, y oportunidades de upsell. Odylic es la primera en saber que un cliente perdió su vuelo — antes que el cliente."
          />
          <BulletCard
            label="Multi-tenant nativo"
            body="Cada ITD ve sólo su cartera. Cada cliente pertenece a un dueño. Odylic ve todo. Las fronteras se respetan; la inteligencia colectiva no."
          />
        </div>
      </Section>

      {/* -------------------------------------------------- WHY NOT */}
      <Section number="05" eyebrow="Por qué no usar Luxe sería un error">
        <h2 className="pitch-h2">
          La pregunta no es si vale la pena. Es{" "}
          <em>cuánto cuesta no hacerlo</em>.
        </h2>

        <div className="pitch-roi">
          <RoiRow
            stat="12h → 2h"
            label="Tiempo de research por propuesta"
            note="Los agentes hacen el trabajo mecánico. La ITD recupera 10 horas por viaje para diseño y relación."
          />
          <RoiRow
            stat="4 días → 4 horas"
            label="Tiempo de respuesta al primer contacto"
            note="Las agencias que cotizan rápido cierran. Las que cotizan lento ven al cliente irse a la siguiente."
          />
          <RoiRow
            stat="0 → ∞"
            label="Pasaportes vencidos detectados"
            note="Hoy, ninguna alerta automática. Mañana, todas las alertas automáticas. La diferencia entre un upgrade en clase ejecutiva y un viaje cancelado."
          />
          <RoiRow
            stat="5×"
            label="Crecimiento de red de ITDs sin crecer el equipo administrativo"
            note="La operación deja de escalar linealmente con el equipo. Los nuevos ITDs entran con toda la infraestructura el día uno."
          />
          <RoiRow
            stat="100%"
            label="Propuestas con calidad editorial garantizada"
            note="Independiente de quién las diseñe. La ITD nueva manda algo del nivel de la ITD veterana, desde su primer cliente."
          />
        </div>

        <blockquote className="pitch-quote">
          No usar Luxe es delegar el margen a la competencia que sí lo está
          usando — y entregar quince horas semanales por ITD a tareas que un
          agente puede hacer mejor mientras la ITD duerme.
        </blockquote>
      </Section>

      {/* -------------------------------------------------- WHAT MAKES ODYLIC DIFFERENT */}
      <Section number="06" eyebrow="La diferencia">
        <h2 className="pitch-h2">
          Las otras boutiques venderán <em>"agencias con AI"</em>. Odylic
          venderá algo distinto.
        </h2>
        <p className="pitch-lede">
          Travel designers respaldadas por agentes que nunca duermen,
          curadas por una marca con criterio, soportadas por una capa
          operativa invisible. La promesa de "perfección invisible" deja de
          ser un eslogan y empieza a tener una arquitectura que la sostiene.
        </p>
      </Section>

      {/* -------------------------------------------------- THE OFFER */}
      <Section number="07" eyebrow="La oferta">
        <h2 className="pitch-h2">Un piloto. Tres ITDs. Noventa días.</h2>

        <div className="pitch-grid-2">
          <div>
            <h3 className="pitch-h3">Lo que entrega Luxe</h3>
            <ul className="pitch-list">
              <li>
                Plataforma white-label completa, brandeada Odylic en cada
                superficie.
              </li>
              <li>
                Onboarding personalizado de 3 ITDs, con migración de su
                cartera actual.
              </li>
              <li>
                Comisiones calculadas con el esquema 50/50 + tiers que ya
                tienes documentado.
              </li>
              <li>
                Document Vault con extracción Vision, propuestas
                brandeadas, agentes operativos, monitoring proactivo,
                reportes en CLP/USD.
              </li>
              <li>
                Soporte directo del equipo de Luxe durante los 90 días.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="pitch-h3">Lo que pedimos</h3>
            <ul className="pitch-list">
              <li>
                Tres ITDs activas dispuestas a dejar entrar nuestros
                agentes a su workflow.
              </li>
              <li>
                Una hora semanal de feedback con su equipo de operaciones.
              </li>
              <li>
                Acceso a sus templates actuales, contratos de proveedores
                preferentes, y branding (logo, paleta, tipografías ya
                tenemos).
              </li>
              <li>
                Una decisión al día 90: continuamos como partner formal, o
                cerramos limpio sin compromiso.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------- CLOSE */}
      <section className="pitch-close">
        <div className="pitch-close-mark">O</div>
        <p className="pitch-close-line">
          <em>
            Para que ninguna ITD tenga que elegir entre independencia y
            respaldo.
          </em>
        </p>
        <p className="pitch-close-line-2">
          Y para que esa frase sea más que un eslogan.
        </p>
        <div className="pitch-close-cta">
          <a href="mailto:sgr@ynk.cl" className="pitch-cta">
            Agendemos los 30 minutos →
          </a>
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------------------- helpers */

function Section({
  number,
  eyebrow,
  children,
}: {
  number: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pitch-section">
      <div className="pitch-section-head">
        <span className="pitch-section-num">{number}</span>
        <span className="pitch-section-eyebrow">{eyebrow}</span>
      </div>
      {children}
    </section>
  );
}

function FeatureCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pitch-feature">
      <h3 className="pitch-feature-title">{title}</h3>
      <div className="pitch-feature-body">{children}</div>
    </div>
  );
}

function BulletCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="pitch-bullet">
      <div className="pitch-bullet-label">{label}</div>
      <p className="pitch-bullet-body">{body}</p>
    </div>
  );
}

function RoiRow({
  stat,
  label,
  note,
}: {
  stat: string;
  label: string;
  note: string;
}) {
  return (
    <div className="pitch-roi-row">
      <div className="pitch-roi-stat">{stat}</div>
      <div>
        <div className="pitch-roi-label">{label}</div>
        <div className="pitch-roi-note">{note}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="pitch-divider" aria-hidden />;
}
