<script setup lang="ts">
const effectiveDate = '20 de agosto de 2026'
</script>

<template>
  <main class="privacy-page">
    <section class="privacy-shell">
      <header class="privacy-header">
        <p class="privacy-kicker">Zocorn</p>
        <h1 class="privacy-title">Politica de Privacidad y Condiciones de Uso</h1>
        <p class="privacy-effective-date">Vigencia: {{ effectiveDate }}</p>
      </header>

      <article class="privacy-card" aria-label="Contenido legal de privacidad y condiciones de uso">
        <section class="privacy-section">
          <h2>1. Informacion que recopilamos</h2>
          <p>
            Zocorn no tiene sistema de registro ni de cuentas de usuario, por lo que no recopilamos nombres,
            contrasenas ni datos de identificacion personal. Cuando visitas o usas esta pagina, podemos guardar:
          </p>
          <ul>
            <li>Direccion IP y fecha/hora de cada visita, a traves de los logs del proveedor de hosting.</li>
            <li>
              Datos guardados unicamente en el almacenamiento local (localStorage) de tu propio navegador: las
              peliculas y series que marcas como favoritas (maximo 20 de cada tipo), tus preferencias de filtros de
              busqueda y si ya has visto el aviso inicial de la web. Estos datos nunca salen de tu dispositivo ni se
              envian a ningun servidor nuestro.
            </li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>2. Uso de la informacion</h2>
          <p>
            La informacion de visitas (IP, fecha) se guarda exclusivamente con fines estadisticos, para mejorar
            rendimiento, estabilidad, seguridad y experiencia general del servicio. Los datos de localStorage se usan
            unicamente para que la propia pagina funcione (recordar tus peliculas/series guardadas y tus filtros).
          </p>
        </section>

        <section class="privacy-section">
          <h2>3. Comparticion con terceros</h2>
          <p>
            No vendemos, alquilamos ni cedemos ninguna informacion a terceros con fines comerciales. Zocorn utiliza
            la API publica de <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The
              Movie Database (TMDB)</a> para mostrar peliculas, series, imagenes y datos relacionados; este producto
            usa la API de TMDB pero no esta respaldado ni certificado por TMDB.
          </p>
        </section>

        <section class="privacy-section">
          <h2>4. Conservacion y eliminacion</h2>
          <p>
            Los logs de visitas del hosting se conservan por un periodo maximo de 30 dias y luego se eliminan de
            forma automatica. Los datos guardados en localStorage (peliculas/series favoritas, filtros, aviso leido)
            permanecen en tu navegador hasta que tu mismo los borres, uses el boton "Borrar todas" dentro de la app,
            o elimines los datos de navegacion de este sitio desde la configuracion de tu navegador.
          </p>
        </section>

        <section class="privacy-section">
          <h2>5. Condiciones de uso</h2>
          <ul>
            <li>Al usar esta pagina aceptas estas politicas y condiciones de uso.</li>
            <li>
              Zocorn es un proyecto personal sin fines comerciales; el contenido audiovisual (titulos, imagenes,
              sinopsis) proviene de TMDB y pertenece a sus respectivos titulares.
            </li>
            <li>No se garantiza disponibilidad continua ni ausencia de errores en el servicio.</li>
          </ul>
        </section>

        <section class="privacy-section">
          <h2>6. Cambios en este documento</h2>
          <p>
            Podemos actualizar esta politica de privacidad y condiciones de uso en cualquier momento. Los cambios se
            publicaran en esta misma pagina.
          </p>
        </section>

        <section class="privacy-section">
          <h2>7. Naturaleza del proyecto y seguridad</h2>
          <p>
            Este sitio es un proyecto personal de pruebas y no tiene finalidad comercial. Aunque se aplican medidas
            razonables para proteger los datos, su objetivo principal es de aprendizaje, por lo que es posible que
            alguna funcionalidad no se comporte siempre como esperas. Si tienes cualquier problema, puedes ponerte en
            contacto con el administrador a traves de los enlaces del pie de pagina.
          </p>
        </section>
      </article>
    </section>
  </main>
</template>

<style scoped src="./PrivacyPolicy.css"></style>
