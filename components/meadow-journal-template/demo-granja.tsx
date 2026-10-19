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
          scene: "ridge",
          shots: [{ scene: "meadow", seed: 8 }, { scene: "barn", seed: 3 }],
          tag: "Granjera icónica",
          camera: "Canon AE-1",
        },
        {
          id: "acantilados",
          date: "2026-10-02",
          place: "Cabo de Peñas",
          text: "Me desperté antes que las gaviotas. Los **acantilados** brillaban y el café sabe mejor **con sal en el aire**.",
          likes: 1840000,
          scene: "coast",
          shots: [{ scene: "coast", seed: 4 }, { scene: "coast", mood: "golden", seed: 9 }],
          tag: "Pelo de sal",
          camera: "Olympus mju II",
        },
        {
          id: "lavanda",
          date: "2026-09-19",
          place: "Brihuega, Guadalajara",
          text: "Perdí la tarde entera entre **filas moradas** y el zumbido de las abejas. Mi bolso todavía huele a **julio**.",
          likes: 3120000,
          scene: "lavender",
          mood: "golden",
          shots: [{ scene: "lavender", mood: "golden", seed: 2 }, { scene: "lake", mood: "golden", seed: 5 }],
          tag: "Abejas",
          camera: "Pentax K1000",
        },
      ]}
      archive={[
        { id: "lago", date: "2026-09-04", place: "Lago de la Ercina", text: "Remamos hasta que el muelle era **una cerilla**. El lago sostenía **dos cielos**.", likes: 940000, scene: "lake", tag: "Remo" },
        { id: "luciernagas", date: "2026-08-22", place: "El prado de abajo", text: "Me tumbé en la hierba hasta que salieron **las luciérnagas**.", likes: 2270000, scene: "meadow", mood: "night", tag: "Noche" },
      ]}
      songs={[
        { title: "Debe ser amor", artist: "Inés Robledo", album: "El Prado", duration: 183, key: 4 },
        { title: "Lunas de papel", artist: "Los del Faro", album: "Marea Baja", duration: 201, key: 9 },
      ]}
      messages={[
        { from: "Marta", text: "¡Amiga, te perdimos! ¿En dónde estás? Llámanos.", time: "14:30" },
        { from: "Abuela", text: "Tráeme miel de lavanda, cariño.", time: "19:10" },
      ]}
      profile={{
        fullName: "Lucía Ferrer",
        handle: "@lucia.delcampo",
        role: "Cuidadora de granjas y fotógrafa analógica",
        bio: "Cambié el ruido de la ciudad por **portones de granero y caminos de tierra**. Lo fotografío todo en **carrete de 35 mm**.",
        location: "Asturias, España",
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
        { id: "f1", scene: "ridge", seed: 3, caption: "La valla de siempre", category: "Campo", tall: true },
        { id: "f2", scene: "coast", seed: 6, caption: "Acantilados a las seis", category: "Mar" },
        { id: "f3", scene: "lavender", mood: "golden", seed: 1, caption: "Filas sin fin", category: "Hora dorada" },
        { id: "f4", scene: "barn", seed: 9, caption: "El granero de las cabras", category: "Campo" },
        { id: "f5", scene: "lake", mood: "night", seed: 2, caption: "Luna en el lago", category: "Mar", tall: true },
        { id: "f6", scene: "meadow", mood: "golden", seed: 4, caption: "Último sol en el prado", category: "Hora dorada" },
      ]}
    />
  )
}
