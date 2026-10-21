"use client"

import MeadowJournalTemplate from "@/components/ui/meadow-journal-template"

export default function DemoGranja() {
  return (
    <MeadowJournalTemplate
      name="Lucía"
      greeting="Hola,"
      credit={{ label: "Diario de", name: "Lucía Ferrer" }}
      locale="es-ES"
      hour12={false}
      palette="sage"
      entries={[
        {
          id: "granjita",
          date: "2026-10-11",
          place: "Una granjita en Asturias",
          text: "Hoy me encuentro en **una granjita** junto al mar, dando de comer a las cabras y mirando los prados que nos regala **la madre naturaleza**. Sed felices.",
          likes: 25000000,
          image: { src: "https://images.unsplash.com/photo-1501854140801-50d01698950b", alt: "Prados verdes y ondulados", tone: "#5a8a3a" },
          shots: [
            { src: "https://images.unsplash.com/photo-1496440737103-cd596325d314", alt: "Lucía con chaqueta vaquera entre los árboles", tone: "#5a6a5a", focus: "50% 30%" },
            { src: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e", alt: "Una vaca en el prado", tone: "#5a8a3a" },
          ],
          tag: "Granjera icónica",
          camera: "Canon AE-1",
        },
        {
          id: "acantilados",
          date: "2026-10-02",
          place: "Cabo de Peñas",
          text: "Me desperté antes que las gaviotas. Los **acantilados** brillaban y el café sabe mejor **con sal en el aire**.",
          likes: 1840000,
          image: { src: "https://images.unsplash.com/photo-1495954484750-af469f2f9be5", alt: "Pasarela de madera hacia el mar", tone: "#7aa0b0" },
          shots: [
            { src: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954", alt: "Dos amigas en bici al atardecer", tone: "#b06a4a" },
            { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", alt: "Olas suaves en la playa", tone: "#9ac0c8" },
          ],
          tag: "Pelo de sal",
          camera: "Olympus mju II",
        },
        {
          id: "lavanda",
          date: "2026-09-19",
          place: "Brihuega, Guadalajara",
          text: "Perdí la tarde entera entre **filas moradas** y el zumbido de las abejas. Mi bolso todavía huele a **julio**.",
          likes: 3120000,
          image: { src: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5", alt: "Lavanda junto a un lago al anochecer", tone: "#7a5a9a" },
          shots: [
            { src: "https://images.unsplash.com/photo-1499002238440-d264edd596ec", alt: "Filas de lavanda al atardecer", tone: "#8a6aa8" },
            { src: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07", alt: "Amapolas entre la hierba", tone: "#c9b48a" },
          ],
          tag: "Abejas",
          camera: "Pentax K1000",
        },
      ]}
      archive={[
        { id: "lago", date: "2026-09-04", place: "Lago de la Ercina", text: "Remamos hasta que el muelle era **una cerilla**. El lago sostenía **dos cielos**.", likes: 940000, image: { src: "https://images.unsplash.com/photo-1508672019048-805c876b67e2", alt: "Un muelle en el lago", tone: "#6a9ab0" }, tag: "Remo" },
        { id: "luciernagas", date: "2026-08-22", place: "El prado de abajo", text: "Me tumbé en la hierba hasta que salieron **las luciérnagas**.", likes: 2270000, image: { src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8", alt: "El prado al amanecer", tone: "#c88a4a" }, tag: "Amanecer" },
      ]}
      songs={[
        { title: "Debe ser amor", artist: "Inés Robledo", album: "El Prado", duration: 183, key: 4, cover: "https://images.unsplash.com/photo-1458560871784-56d23406c091" },
        { title: "Lunas de papel", artist: "Los del Faro", album: "Marea Baja", duration: 201, key: 9, cover: "https://images.unsplash.com/photo-1471478331149-c72f17e33c73" },
      ]}
      messages={[
        { from: "Marta", text: "¡Amiga, te perdimos! ¿En dónde estás? Llámanos.", time: "14:30", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330" },
        { from: "Abuela", text: "Tráeme miel de lavanda, cariño.", time: "19:10", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91" },
      ]}
      profile={{
        fullName: "Lucía Ferrer",
        handle: "@lucia.delcampo",
        role: "Cuidadora de granjas y fotógrafa analógica",
        bio: "Cambié el ruido de la ciudad por **portones de granero y caminos de tierra**. Lo fotografío todo en **carrete de 35 mm**.",
        location: "Asturias, España",
        avatar: { src: "https://images.unsplash.com/photo-1496440737103-cd596325d314", alt: "Lucía", focus: "50% 20%" },
        stats: [
          { label: "Publicaciones", value: 312 },
          { label: "Seguidores", value: 25000000 },
          { label: "Granjas", value: 18 },
        ],
        currently: [
          { label: "Leyendo", value: "Nada, de Carmen Laforet" },
          { label: "Llevo", value: "Botas de agua, siempre" },
          { label: "Tiempo", value: "16 grados y sol" },
        ],
        links: [{ label: "Instagram", href: "#" }, { label: "Boletín", href: "#" }],
      }}
      notes={[
        { name: "Marta", text: "Vuelve pronto, la ciudad te echa de menos." },
        { name: "Pablo", text: "Tus fotos de lavanda me salvaron la semana." },
      ]}
      footer={{ title: "Nos vemos en **el campo**.", note: "Notas de campo de Lucía Ferrer.", links: [{ label: "Instagram", href: "#" }, { label: "Contacto", href: "#" }] }}
      labels={{
        tabs: ["Inicio", "Perfil", "Fotos", "Archivo"],
        likedBy: "Le ha gustado a **{count} de personas** que sigues",
        youLiked: "Le ha gustado a **ti y a {count} de personas** que sigues",
        statuses: ["activa ahora", "en el campo", "desconectada"],
        more: "más",
        nowPlaying: "Sonando:",
        songBy: "canción de",
        album: "Álbum:",
        duration: "Duración:",
        minutes: "min.",
        play: "Reproducir",
        pause: "Pausa",
        prevSong: "Canción anterior",
        nextSong: "Canción siguiente",
        newMessages: "Mensajes nuevos:",
        nextMessage: "Mensaje siguiente",
        reply: "Responder",
        replyTo: "Responder a {name}",
        send: "Enviar",
        cancel: "Cancelar",
        sending: "Enviando",
        sent: "Enviado a {name}.",
        failed: "No se pudo enviar.",
        caughtUp: "Todo leído. ¡Sal a la calle!",
        readAgain: "Leer otra vez",
        takenBy: "Tomada con **{camera}**",
        removeTag: "Quitar etiqueta",
        fromArchive: "Del **archivo**",
        like: "Me gusta",
        profileTitle: "Sobre **mí**",
        follow: "Seguir",
        following: "Siguiendo",
        message: "Mensaje",
        currently: "Ahora mismo",
        postcard: "Ojalá estuvieras aquí",
        photosTitle: "Mis **fotos**",
        all: "Todo",
        photoCount: "{count} fotos, todas en carrete",
        archiveTitle: "El **archivo**",
        search: "Buscar en el archivo",
        noResults: "Nada por aquí.",
        readMore: "Leer más",
        readLess: "Menos",
        showAll: "Ver los {count} días",
        pin: "Fijar arriba",
        pinned: "Arriba",
        guestbookTitle: "Libro de **visitas**",
        guestbookText: "Saluda, recomiéndame una canción o un sitio. Tu nota se queda en el tablón.",
        yourName: "Tu nombre",
        yourNote: "Tu nota",
        pinNote: "Fijar",
        noteThanks: "¡Fijada! Gracias.",
        copyLink: "Copiar enlace del perfil",
        copied: "Enlace copiado.",
        nightMode: "Modo noche",
        dayMode: "Modo día",
        toGuestbook: "Firmar el libro",
        backToTop: "Volver arriba",
        scrub: "Posición en la página",
        close: "Cerrar",
        previous: "Anterior",
        next: "Siguiente",
        entry: "Entrada {n}",
      }}
      photos={[
        { id: "f1", src: "https://images.unsplash.com/photo-1496440737103-cd596325d314", alt: "Lucía en el bosque", caption: "Domingo sin prisa", category: "Retratos", tall: true },
        { id: "f2", src: "https://images.unsplash.com/photo-1495954484750-af469f2f9be5", alt: "Pasarela hacia el mar", caption: "Camino a la playa", category: "Mar" },
        { id: "f3", src: "https://images.unsplash.com/photo-1499002238440-d264edd596ec", alt: "Lavanda al atardecer", caption: "Filas sin fin", category: "Hora dorada" },
        { id: "f4", src: "https://images.unsplash.com/photo-1500076656116-558758c991c1", alt: "Un granero viejo al atardecer", caption: "El granero de siempre", category: "Campo" },
        { id: "f5", src: "https://images.unsplash.com/photo-1524024973431-2ad916746881", alt: "Una cabra blanca", caption: "Gertrudis, poco impresionada", category: "Campo", tall: true },
        { id: "f6", src: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8", alt: "El prado al amanecer", caption: "Las cinco de la mañana", category: "Hora dorada" },
      ]}
    />
  )
}
