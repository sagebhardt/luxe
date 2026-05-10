import type { Metadata } from "next";
import { HeroAgentTicker } from "@/components/pitch/HeroAgentTicker";
import {
  TripWorkspaceMockup,
  CrmIntelligenceMockup,
  PipelineMockup,
  DocumentVaultMockup,
  ReportsMockup,
  MidTripCompanionMockup,
  NpsMockup,
} from "@/components/pitch/ProductMockups";
import { ProjectionChart } from "@/components/pitch/ProjectionChart";
import { PITCH_IMAGES, unsplashUrl } from "@/components/pitch/images";

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
        <div className="pitch-hero-left">
          <div className="pitch-hero-mark">
            Luxe<sup>AI</sup>
          </div>
          <div className="pitch-hero-eyebrow">
            Una propuesta para Odylic · Mayo 2026
          </div>
          <h1 className="pitch-hero-h1">
            Servicio de altísima gama, <em>a escala</em>, sin perder el
            toque humano.
          </h1>
          <p className="pitch-hero-sub">
            Luxe es la plataforma agéntica que trabaja junto a cada
            Independent Travel Designer. Los agentes investigan, redactan,
            vigilan y ordenan en silencio. La travel designer decide,
            firma, y queda libre para hacer lo único que un agente nunca
            podrá: estar presente con el cliente.
          </p>
          <div className="pitch-hero-quote">
            <em>"Diseñamos viajes con intención, criterio y alma."</em>
            <span className="pitch-hero-cite">— Odylic</span>
          </div>
        </div>
        <div className="pitch-hero-right">
          <HeroAgentTicker />
        </div>
      </section>

      {/* -------------------------------------------------- IMAGE COLLAGE */}
      <section className="pitch-collage" aria-hidden="true">
        <div
          className="pitch-collage-img tall"
          style={{ backgroundImage: `url(${unsplashUrl(PITCH_IMAGES.blossoms, { w: 900, h: 1200 })})` }}
        />
        <div
          className="pitch-collage-img"
          style={{ backgroundImage: `url(${unsplashUrl(PITCH_IMAGES.safari, { w: 900, h: 600 })})` }}
        />
        <div
          className="pitch-collage-img"
          style={{ backgroundImage: `url(${unsplashUrl(PITCH_IMAGES.tropical, { w: 900, h: 600 })})` }}
        />
        <div
          className="pitch-collage-img"
          style={{ backgroundImage: `url(${unsplashUrl(PITCH_IMAGES.marrakech, { w: 900, h: 600 })})` }}
        />
        <div
          className="pitch-collage-img tall"
          style={{ backgroundImage: `url(${unsplashUrl(PITCH_IMAGES.mountains, { w: 900, h: 1200 })})` }}
        />
      </section>

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

        <TripWorkspaceMockup />

        <p className="pitch-body" style={{ marginTop: "32px" }}>
          La ITD lee, ajusta, aprueba. El agente emite la confirmación, lo
          registra en el itinerario, lo suma al presupuesto comprometido, y
          actualiza el activity log del cliente. Todo lo que solía vivir en
          memoria personal ahora vive con el cliente, indexable, recuperable,
          compartible.
        </p>
      </Section>

      <ImageBand src={unsplashUrl(PITCH_IMAGES.desert, { w: 2000, h: 700 })}>
        <em>"En Odylic, el lujo está en la sutileza de los detalles, en
        la confidencialidad absoluta, en el acceso a lo inaccesible."</em>
      </ImageBand>

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

        <CrmIntelligenceMockup />

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

        <DocumentVaultMockup />

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

        <FeatureCard title="Una posición que la competencia no puede ofrecer.">
          <p>
            La descripción de trabajo de un travel designer en una boutique
            estándar todavía pide{" "}
            <em>"proficiency en Microsoft Excel y PowerPoint."</em> El
            trabajo real es Excel para cotizar, PowerPoint para vender,
            email para coordinar, y memoria personal para todo lo demás.
            Luxe convierte esa posición en otra cosa: la ITD diseña, no
            transcribe. Atiende más clientes con menos fricción, gana más
            por cliente, y vuelve a casa habiendo hecho lo creativo —
            porque lo mecánico lo hizo un agente. Reclutar talento de
            primera deja de ser un argumento de sueldo y se vuelve un
            argumento de <em>cómo se ve un día de trabajo</em>.
          </p>
        </FeatureCard>
      </Section>

      <ImageBand src={unsplashUrl(PITCH_IMAGES.hotel, { w: 2000, h: 700 })}>
        <em>"Acceso a lo inaccesible. Perfección invisible."</em>
      </ImageBand>

      {/* -------------------------------------------------- PRESENCE */}
      <Section number="04" eyebrow="Estar presente">
        <h2 className="pitch-h2">
          La diferencia entre <em>haber reservado un viaje</em> y haber sido
          acompañado en uno.
        </h2>
        <p className="pitch-lede">
          Las otras plataformas terminan cuando el vuelo despega. Luxe
          empieza ahí. La página privada del cliente se vuelve un
          compañero vivo durante el viaje: sabe en qué día está, dónde
          está, qué viene esta tarde — y le habla a través de la voz de
          su travel designer, no de un sistema.
        </p>

        <MidTripCompanionMockup />

        <FeatureCard title="Notas firmadas, no notificaciones.">
          <p>
            Cuando llueve en Tokio y la cena del rooftop hay que moverla
            adentro, el cliente no recibe una alerta del sistema. Recibe
            una nota firmada: <em>"A note from Camila — moví la cena del
            rooftop adentro. La vista es igual de hermosa."</em> El cambio
            es exactamente el mismo. La sensación es completamente
            distinta. La ITD sigue siendo la voz; Luxe sólo amplifica su
            presencia.
          </p>
        </FeatureCard>

        <FeatureCard title="Sorpresas curadas, reveladas a tiempo.">
          <p>
            La cena de aniversario reservada en secreto, el amenity en la
            habitación, el guía local que aparece sin haber sido pedido —
            la ITD las marca como <em>surprise</em> en el workspace.
            Quedan invisibles para el cliente hasta el día que ocurren.
            Ese día aparecen con un sello discreto: <em>A small touch.</em>{" "}
            La logística se cumple; la magia se preserva.
          </p>
        </FeatureCard>

        <FeatureCard title="Hoy primero. Mañana después.">
          <p>
            Cuando el cliente abre su página estando en Kyoto, no ve el
            día 1 — ya pasó. Ve <em>hoy</em>: dónde está, qué viene esta
            tarde, qué empacar mañana. La página se reordena sola según
            la fase del viaje. Antes del viaje muestra el countdown.
            Durante, muestra el ahora. Después, abre espacio para
            escuchar.
          </p>
        </FeatureCard>

        <FeatureCard title="Escuchar después, sin formularios fríos.">
          <p>
            Al volver, la página privada del cliente se transforma una
            vez más. Aparece un solo gesto pequeño: <em>"Marcela, your
            honest read shapes everything we do next."</em> Una escala de
            0 a 10. Un cuadro de texto. Su respuesta llega directa al
            CRM de la ITD, queda atada a este viaje específico, y entra
            al patrón de inteligencia del cliente. Nada se pierde, nada
            se siente automático.
          </p>
        </FeatureCard>

        <NpsMockup />

        <p className="pitch-body" style={{ marginTop: "32px" }}>
          La ITD no escala dejando de estar presente. Escala estando
          presente <em>en más momentos relevantes</em> — y dejando que
          Luxe se encargue de todo lo demás.
        </p>
      </Section>

      <ImageBand src={unsplashUrl(PITCH_IMAGES.tropical, { w: 2000, h: 700 })}>
        <em>"El verdadero lujo no es lo que se reserva — es sentirse
        acompañado en cada momento del viaje."</em>
      </ImageBand>

      {/* -------------------------------------------------- ODYLIC VIEW */}
      <Section number="05" eyebrow="Para Odylic">
        <h2 className="pitch-h2">
          Consistencia y control son <em>lo primero que se rompe</em>{" "}
          cuando una boutique escala.
        </h2>
        <p className="pitch-lede">
          Tres ITDs en cinco oficinas usando cinco templates de
          propuesta. Cada uno con su Excel de comisiones. Pasaportes en
          carpetas distintas. La voz de la marca depende de quién
          escribió el último email. La calidad del servicio se vuelve
          función del ITD que tocó al cliente — no de Odylic. <em>Eso es
          lo que Luxe arregla primero.</em> Una sola fuente de verdad,
          una sola voz de marca, una sola arquitectura operativa — y la
          libertad de cada ITD de operar con su criterio dentro de ella.
        </p>

        <PipelineMockup />

        <div className="pitch-grid-3" style={{ marginTop: "32px" }}>
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
          <BulletCard
            label="Retención sin esfuerzo"
            body="El acompañamiento mid-trip y las sorpresas curadas convierten un viaje en una experiencia memorable — y la mejor estrategia de retención es un cliente que vuelve a casa contando una historia. La presencia continua hace el upsell del próximo viaje antes de que la ITD lo pida."
          />
          <BulletCard
            label="Loop de feedback cerrado"
            body="Cada NPS post-viaje queda atado a su viaje específico, alimenta el patrón de inteligencia del cliente, y entra al CRM de la ITD. Odylic ve la curva de NPS por destino, por ITD, por temporada — y aprende qué funciona, sin pedir reportes."
          />
          <BulletCard
            label="Control con auditoría completa"
            body="Cada acción administrativa — reasignación de cliente, cambio de tier de comisión, edición de proveedor preferente — queda en un audit log con quién, cuándo y qué cambió. La gobernanza no se delega a la confianza; se delega a la arquitectura. Odylic decide quién puede hacer qué; Luxe lo registra todo."
          />
          <BulletCard
            label="Imán de talento"
            body="La competencia recluta travel designers ofreciendo Excel y PowerPoint. Odylic ofrece una plataforma agéntica donde la ITD diseña en lugar de transcribir, atiende más clientes con menos fricción, y gana más por cliente. La posición se vuelve la mejor del mercado — y eso compounde con cada nueva contratación."
          />
        </div>

        <div style={{ marginTop: "48px" }}>
          <h3 className="pitch-h3" style={{ marginBottom: "20px" }}>
            Reportes en la moneda de Odylic, FX-correcto.
          </h3>
          <ReportsMockup />
        </div>
      </Section>

      <ImageBand src={unsplashUrl(PITCH_IMAGES.ocean, { w: 2000, h: 700 })}>
        <em>"Diseñemos viajes extraordinarios juntos."</em>
      </ImageBand>

      {/* -------------------------------------------------- WHY NOT */}
      <Section number="06" eyebrow="Por qué no usar Luxe sería un error">
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
          <RoiRow
            stat="0 → 100%"
            label="Viajes con NPS capturado y atado al cliente"
            note="Hoy, NPS es una intuición. Mañana, es un dato por viaje, por destino, por temporada — alimentando el patrón de inteligencia del cliente y la curva de aprendizaje de Odylic."
          />
          <RoiRow
            stat="±30%"
            label="Retención esperada con presencia mid-trip"
            note="Los clientes que se sienten acompañados durante el viaje vuelven más, refieren más, y aceptan más upgrades. La industria lo sabe; nadie lo entrega bien. Luxe sí."
          />
          <RoiRow
            stat="2× → 3×"
            label="Capacidad de reclutamiento sin diluir calidad"
            note="La posición de travel designer en Odylic deja de competir con boutiques que piden Excel y PowerPoint. Compite — y gana — contra cualquier rol creativo en la región. El talento top elige la marca con la mejor herramienta."
          />
        </div>

        <blockquote className="pitch-quote">
          No usar Luxe es delegar el margen a la competencia que sí lo está
          usando — y entregar quince horas semanales por ITD a tareas que un
          agente puede hacer mejor mientras la ITD duerme.
        </blockquote>
      </Section>

      {/* -------------------------------------------------- PROJECTION */}
      <Section number="07" eyebrow="La proyección">
        <h2 className="pitch-h2">
          La matemática del crecimiento, <em>sin promesas mágicas</em>.
        </h2>
        <p className="pitch-lede">
          La pregunta correcta no es "¿cuánto vale Luxe?". Es{" "}
          <em>"¿cómo se ve el negocio en 36 meses, con o sin?"</em> Esta
          es nuestra estimación — bottom-up, dos palancas explícitas,
          tres escenarios. No una proyección de marketing: un modelo
          auditable que se calibra con la data real de Odylic en una
          sesión de modelado.
        </p>

        <ProjectionChart />

        <h3 className="pitch-h3" style={{ marginTop: "44px" }}>
          Las tres palancas
        </h3>
        <p className="pitch-body">
          El crecimiento no viene de un solo efecto mágico. Viene de tres
          fuerzas que <em>compounden</em>: cada ITD opera con menos
          fricción operativa (<em>capacidad</em>), los clientes existentes
          vuelven más seguido (<em>retención</em>), y la posición de
          travel designer en Odylic se vuelve más atractiva que la de la
          competencia (<em>talento</em>). La tercera es la que sostiene
          las primeras dos en el largo plazo — sin talento que escala,
          la red no escala.
        </p>

        <div className="proj-table" role="table" aria-label="Supuestos del modelo">
          <div className="proj-table-row head" role="row">
            <span className="proj-table-cell" role="columnheader">
              Variable
            </span>
            <span className="proj-table-cell" role="columnheader">
              Sin Luxe
            </span>
            <span className="proj-table-cell" role="columnheader">
              Con Luxe (conservador)
            </span>
            <span className="proj-table-cell" role="columnheader">
              Con Luxe (base)
            </span>
          </div>
          <ProjRow
            variable="ITDs activas (mes 0 → 36)"
            sinLuxe="5 → 7"
            consv="5 → 9"
            base="5 → 12"
          />
          <ProjRow
            variable="Trips por ITD por año"
            sinLuxe="18"
            consv="18 → 25"
            base="18 → 32"
          />
          <ProjRow
            variable="Margen promedio por trip"
            sinLuxe="$9,800"
            consv="$9,800"
            base="$9,800 → $10,500"
          />
          <ProjRow
            variable="Retención dentro de 24m"
            sinLuxe="~45%"
            consv="~52% (+7pp)"
            base="~57% (+12pp)"
          />
          <ProjRow
            variable="Horas de research por propuesta"
            sinLuxe="~12h"
            consv="~3h"
            base="~2h"
          />
          <ProjRow
            variable="Margen anual al mes 36"
            sinLuxe="$1.2M"
            consv="$2.2M"
            base="$4.0M"
            bold
          />
        </div>

        <div className="proj-method">
          <div className="proj-method-lbl">Metodología</div>
          <p>
            El modelo computa{" "}
            <em>margen anual = ITDs activas × trips/ITD/año × margen
            promedio</em>{" "}
            en cada punto, con cada palanca rampando linealmente entre
            t=0 y t=36. La capacidad por ITD se basa en el ahorro de
            tiempo medible (12h → 2h por propuesta libera ~10h × 18
            trips ≈ 180h al año, equivalente a 4-5 semanas adicionales
            de capacidad). El boost de retención se ancla en literatura
            pública de programas concierge en hospitalidad de lujo —
            rangos típicos de +5 a +15pp dentro de 24 meses; usamos +7pp
            (conservador) y +12pp (base).
          </p>
          <p style={{ marginTop: "10px" }}>
            El crecimiento de ITDs activas (de 5 a 12 en el escenario
            base) asume lo que el modelo de Odylic permite: una posición
            de travel designer más atractiva que la del mercado, capaz
            de reclutar talento top sin diluir calidad. <em>Sin
            herramienta superior, ese crecimiento se topa contra el
            techo de reclutamiento alrededor de los 7-8 ITDs.</em>{" "}
            Luxe no agrega ITDs por sí solo — agrega la condición que
            permite agregarlas.
          </p>
          <p style={{ marginTop: "10px" }}>
            <em>Lo que el modelo no asume:</em> que Luxe captura nuevos
            clientes por sí solo, que los precios suben, o que la
            competencia se queda quieta. Sólo asume que cada ITD opera
            mejor con la plataforma, que los clientes acompañados vuelven
            más, y que un buen travel designer prefiere trabajar con
            mejores herramientas. Si Odylic decide compartir su ticket
            promedio real, su mix por destino y su tasa actual de
            repetición, estos números se vuelven proyección — y el
            upside, casi siempre, es mayor.
          </p>
        </div>
      </Section>

      {/* -------------------------------------------------- WHAT MAKES ODYLIC DIFFERENT */}
      <Section number="08" eyebrow="La diferencia">
        <h2 className="pitch-h2">
          Las otras boutiques venderán <em>"agencias con AI"</em>. Odylic
          venderá algo distinto.
        </h2>
        <p className="pitch-lede">
          La industria está corriendo a llenar el viaje de chatbots y
          formularios. Odylic va en la dirección opuesta: <em>más humano,
          en más momentos, con más contexto</em>. Los agentes hacen el
          trabajo invisible para que la travel designer pueda hacer el
          visible — escribir la nota a mano, anticipar la sorpresa, mover
          la cena cuando llueve. Luxe no reemplaza el toque humano; lo
          amplifica al punto en que se vuelve económicamente viable a
          escala.
        </p>
        <p className="pitch-lede" style={{ marginTop: "20px" }}>
          La promesa de <em>"perfección invisible"</em> deja de ser un
          eslogan y empieza a tener una arquitectura que la sostiene.
        </p>
      </Section>

      {/* -------------------------------------------------- THE OFFER */}
      <Section number="09" eyebrow="La oferta">
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
                Página privada del cliente <em>siempre activa</em> —
                pre-viaje, durante, y post-viaje — con notas firmadas
                por la ITD, sorpresas curadas, y captura de NPS.
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
      <section
        className="pitch-close"
        style={{
          backgroundImage: `linear-gradient(rgba(45,64,56,0.90), rgba(45,64,56,0.92)), url(${unsplashUrl(PITCH_IMAGES.nature, { w: 2400, h: 1400 })})`,
        }}
      >
        <div className="pitch-close-mark">O</div>
        <p className="pitch-close-line">
          <em>
            Para que el toque humano no sea lo primero que se pierde
            cuando la agencia crece.
          </em>
        </p>
        <p className="pitch-close-line-2">
          Y para que <em>"perfección invisible"</em> tenga, por fin, una
          arquitectura que la sostiene.
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

function ProjRow({
  variable,
  sinLuxe,
  consv,
  base,
  bold,
}: {
  variable: string;
  sinLuxe: string;
  consv: string;
  base: string;
  bold?: boolean;
}) {
  const cellClass = bold ? "proj-table-cell" : "proj-table-cell";
  return (
    <div className="proj-table-row" role="row">
      <span className={`${cellClass} lbl`} role="cell">
        {variable}
      </span>
      <span className={`${cellClass} muted`} role="cell">
        {bold ? <em>{sinLuxe}</em> : sinLuxe}
      </span>
      <span className={cellClass} role="cell">
        {bold ? <em>{consv}</em> : consv}
      </span>
      <span className={cellClass} role="cell">
        {bold ? <em>{base}</em> : base}
      </span>
    </div>
  );
}

function ImageBand({
  src,
  children,
}: {
  src: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="pitch-imageband"
      style={{ backgroundImage: `url(${src})` }}
    >
      <div className="pitch-imageband-inner">
        {children ? <p className="pitch-imageband-quote">{children}</p> : null}
      </div>
    </section>
  );
}
