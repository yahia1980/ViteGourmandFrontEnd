
// Menu de navigation

const rightBar = document.getElementById("navbar");
const btn = document.getElementById("hamburger");

btn.addEventListener("click", () => {
   btn.classList.toggle("active");
   rightBar.classList.toggle("active");
});


const links = rightBar.querySelectorAll("a");

links.forEach(link => {
    link.addEventListener("click", () => {
        btn.classList.remove("active");
        rightBar.classList.remove("active");
    });
});



// défilement avis clients


document.addEventListener("click", (event) => {
    const spanClique = event.target.closest(".avisRatio .ratio");

    if (!spanClique) return;

    const container = spanClique.closest(".avisContainer");
    if (!container) return;

    const spans = container.querySelectorAll(".avisRatio .ratio");
    const avis = container.querySelectorAll(".avisPersonne");

    const index = Array.from(spans).indexOf(spanClique);

    if (index < 0 || index >= avis.length) return;

    // Afficher l'avis correspondant
    avis.forEach((element, i) => {
        element.style.display = i === index ? "block" : "none";
    });

    // Changer la couleur du span sélectionné
    spans.forEach((span, i) => {
        span.style.backgroundColor =
            i === index ? "var(--bleue)" : "var(--white)";
    });
});


