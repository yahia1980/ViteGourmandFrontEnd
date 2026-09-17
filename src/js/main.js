const listMenus = document.getElementById("liste-menus");

const menus = [{
    // menu1
    titre:"Boeuf au soja",
    description:"Bœuf mariné au soja & gingembre, légumes croquants au wok, riz jasmin parfumé.",
    personnesMin:6,
    prix:147,
    image:"images/img2.png",
    theme:"pâques",
    regime:"classique"
},
{
    // menu2
    titre:"salade au saumon",
    description:"Saumon fumé, avocat, pamplemousse rose et jeunes pousses, vinaigrette au citron vert & aneth.",
    personnesMin:5,
    prix:66,
    image:"images/végitarien.png",
    theme:"classique",
    regime:"végitarien"
},
{
    //menu 3
    titre:"poulet rôti",
    description:"Poulet fermier rôti au thym frais, jus corsé et pommes grenailles confites.",
    personnesMin:4,
    prix:85,
    image:"images/img3.png",
    theme:"Noël",
    regime:"classique"
}]
 const detailMenu =document.getElementById("details-menu");
for(let menu of menus ) {
 const carte = document.createElement("div");
 const h3 = document.createElement("h3");
 const descriptMenu = document.createElement("p");
 const persMinMenu = document.createElement("p");
 const prixMenu = document.createElement("p");
 const themeMenu = document.createElement("p");
 const regimeMenu = document.createElement("p");
 const imageMenu = document.createElement("img");
 const voirMenu =document.createElement("button");


 voirMenu.addEventListener("click", function(){
     const menuDetailTitre = document.createElement("h2");
     const menuDetailDescript = document.createElement("p");
     const menuDetailPersoMin = document.createElement("p");
     const menuDetailPrix = document.createElement("p");
     const menuDetailTheme = document.createElement("p");
     const menuDetailRegime = document.createElement("p");
     const imageDetailMenu = document.createElement("img");
     const fermer = document.createElement("button");
     menuDetailTitre.textContent = menu.titre;
     menuDetailDescript.textContent = menu.description;
     menuDetailPersoMin.textContent ="Nombre de personne minimum : "+ menu.personnesMin;
     menuDetailPrix.textContent ="Prix par menu : "+ menu.prix + " €";
     menuDetailTheme.textContent = menu.theme;
     menuDetailRegime.textContent =menu.regime;
     
     fermer.textContent = "Fermer";
     detailMenu.innerHTML="";
     imageDetailMenu.src =menu.image;
     detailMenu.classList.add("detailMenu");
     imageDetailMenu.classList.add("image-menu");
     detailMenu.appendChild(imageDetailMenu);
     detailMenu.appendChild(menuDetailTitre);
     detailMenu.appendChild(menuDetailDescript);
     detailMenu.appendChild(menuDetailPersoMin);
     detailMenu.appendChild(menuDetailPrix);
     detailMenu.appendChild(menuDetailTheme);
     detailMenu.appendChild(menuDetailRegime);
     detailMenu.appendChild(fermer);
     fermer.addEventListener("click", function(){
     detailMenu.innerHTML="";
     detailMenu.classList.remove("detailMenu");
         
     });
   
     fermer.classList.add("btnMenu");
    
 });  
carte.classList.add("carte-menu");
imageMenu.src =menu.image;
imageMenu.classList.add("image-menu");
voirMenu.classList.add("btnMenu");
h3.textContent = menu.titre;
descriptMenu.textContent = menu.description;
persMinMenu.textContent = "Nombre de personne minimum : "+ menu.personnesMin + " personnes";
prixMenu.textContent ="Prix par menu : "+ menu.prix +" €";
themeMenu.textContent= menu.theme;
regimeMenu.textContent= menu.regime;
voirMenu.textContent= "voir le menu"
carte.appendChild(imageMenu);
carte.appendChild(h3);
carte.appendChild(descriptMenu);
carte.appendChild(persMinMenu);
carte.appendChild(prixMenu);
carte.appendChild(themeMenu);
carte.appendChild(regimeMenu);
carte.appendChild(voirMenu);
listMenus.appendChild(carte);
console.log(carte);
}
