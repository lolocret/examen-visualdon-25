import * as d3 from "d3";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import "./style.css";  // Si vous avez besoin de styles CSS spécifiques

/*
========================================================================================================================
1. Dessin SVG (15 points)
========================================================================================================================
Vous pouvez dessiner la figure soit à partir d'ici ou directement dans l'HTML (index.html).
*/
const svg = d3.select("#drawing");
const centerX = 300;
const centerY = 250;

svg.append("line").attr("x1", centerX).attr("y1", centerY - 100).attr("x2", centerX - 80).attr("y2", centerY - 50).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX).attr("y1", centerY - 100).attr("x2", centerX + 80).attr("y2", centerY - 50).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX - 80).attr("y1", centerY - 50).attr("x2", centerX - 80).attr("y2", centerY + 80).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX + 80).attr("y1", centerY - 50).attr("x2", centerX + 80).attr("y2", centerY + 80).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX - 80).attr("y1", centerY + 80).attr("x2", centerX).attr("y2", centerY + 130).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX + 80).attr("y1", centerY + 80).attr("x2", centerX).attr("y2", centerY + 130).attr("stroke", "black").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX).attr("y1", centerY - 100).attr("x2", centerX).attr("y2", centerY + 50).attr("stroke", "red").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX).attr("y1", centerY + 50).attr("x2", centerX - 80).attr("y2", centerY + 80).attr("stroke", "red").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX).attr("y1", centerY + 50).attr("x2", centerX + 80).attr("y2", centerY + 80).attr("stroke", "red").attr("stroke-width", 2);
svg.append("line").attr("x1", centerX - 40).attr("y1", centerY + 30).attr("x2", centerX + 10).attr("y2", centerY + 30).attr("stroke", "black").attr("stroke-width", 2);
svg.append("rect").attr("x", centerX - 110).attr("y", centerY - 70).attr("width", 30).attr("height", 30).attr("stroke", "black").attr("stroke-width", 2).attr("fill", "none");
svg.append("rect").attr("x", centerX + 80).attr("y", centerY - 70).attr("width", 30).attr("height", 30).attr("stroke", "black").attr("stroke-width", 2).attr("fill", "none");


/*
========================================================================================================================
2. Manipulation des données (15 points)
========================================================================================================================
*/

const dataCantons = "../data/cantons_average_daily_trafic.geojson";
const dataNetwork = "../data/network_average_daily_trafic.geojson";

Promise.all([
    d3.json(dataCantons),
    d3.json(dataNetwork)
]).then(([cantons, network]) => {
     
     console.log('Données des cantons :', cantons);
     console.log('Données du réseau ferroviaire :', network);

    // 2.1 Le canton ayant la plus grande charge de passagers sur le réseau ferroviaire
    // 2.2 Les 10 cantons ayant la plus grande charge de passagers sur le réseau ferroviaire
   const cantonsData = cantons.features.map(d => {
    return {
      name: d.properties.name,
      trafic: d.properties.avg_daily_trafic,
      pop: d.properties.population,
      ratio: d.properties.avg_daily_trafic / d.properties.population * 10000
    };
  });

  const top1 = cantonsData.reduce((a, b) => (a.ratio > b.ratio ? a : b));
  console.log(" 1. Canton avec la plus grande charge/passagers sur le réseau férroviaire :", top1);

  const top10 = [...cantonsData].sort((a, b) => b.ratio - a.ratio).slice(0, 10);
  console.log("2. Les 10 cantons ayant la plus grande charge de passagers sur le réseau férroviaire :", top10);

    // 2.3 Représentativité des données
 console.log("3. Ces données sont utiles mais pas suffisantes pour comparer les cantons.");
  console.log("On pourrait aussi prendre en compte la surface, le nombre de gares ou l’importance du tourisme...");

/*
========================================================================================================================
3. Visualisations (70 points)
========================================================================================================================
*/

    // --- 3.1 Carte choroplète ---
    // Affichez les cantons avec une couleur basée sur le nombre de passagers par 10'000 habitants

    const map = L.map("map").setView([46.8, 8.3], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  const ratios = cantonsData.map(d => d.ratio);
  const colorScale = d3.scaleSequential().domain([d3.min(ratios), d3.max(ratios)]).interpolator(d3.interpolateYlGnBu);

  L.geoJSON(cantons, {
    style: feature => {
      const ratio = feature.properties.avg_daily_trafic / feature.properties.population * 10000;
      return {
        fillColor: colorScale(ratio),
        weight: 1,
        color: "#333",
        fillOpacity: 0.7
      };
    },
    onEachFeature: (feature, layer) => {
      const ratio = feature.properties.avg_daily_trafic / feature.properties.population * 10000;
      layer.bindTooltip(`${feature.properties.name}<br>${Math.round(ratio)} pass./10k hab`);
      layer.on("mouseover", () => layer.setStyle({ weight: 3 }));
      layer.on("mouseout", () => layer.setStyle({ weight: 1 }));
    }
  }).addTo(map);


    // --- 3.2 Visualisation de la Charge de Passagers sur le Réseau Ferroviaire ---
    const map2 = L.map("map2").setView([46.8, 8.3], 8);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(map2);


  const title = L.control({ position: "topright" });
  const legend = L.control({ position: "bottomright" });
  const trafics = network.features.map(d => d.properties.avg_daily_trafic);
  const widthScale = d3.scaleLinear().domain(d3.extent(trafics)).range([1, 8]);
  const colorLine = d3.scaleSequential().domain(d3.extent(trafics)).interpolator(d3.interpolateReds);

  title.onAdd = function (map) {
  const div = L.DomUtil.create("div", "map-title");
  div.innerHTML = "<h4>Passagers par 10'000 habitants</h4>";
  div.style.background = "white";
  div.style.padding = "8px";
  div.style.borderRadius = "6px";
  div.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";
  return div;
};

title.addTo(map);

legend.onAdd = function (map) {
  const div = L.DomUtil.create("div", "info legend");
  const grades = d3.ticks(d3.min(ratios), d3.max(ratios), 5);

  div.innerHTML += "<strong>Pass./10k hab</strong><br>";

  grades.forEach((d, i) => {
    const color = colorScale(d);
    div.innerHTML += `
      <i style="background:${color};width:18px;height:18px;display:inline-block;margin-right:5px;"></i> 
      ${Math.round(d)}<br>`;
  });

  div.style.background = "white";
  div.style.padding = "8px";
  div.style.borderRadius = "6px";
  div.style.boxShadow = "0 0 5px rgba(0,0,0,0.3)";

  return div;
};

legend.addTo(map);

  L.geoJSON(network, {
    style: feature => ({
      color: colorLine(feature.properties.avg_daily_trafic),
      weight: widthScale(feature.properties.avg_daily_trafic)
    }),
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(`Trafic: ${feature.properties.avg_daily_trafic.toLocaleString()} pass./jour`);
    }
  }).addTo(map2);


    // --- 3.3 Diagramme en bâtons ---
    const margin = { top: 40, right: 30, bottom: 30, left: 120 };
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svgBar = d3.select("#barchart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    svgBar.append("text")
  .attr("x", width / 2)
  .attr("y", -13)
  .attr("text-anchor", "middle")
  .style("font-size", "15px")
  .style("font-weight", "bold")
  .text("Top 10 des cantons charge de passagers / 10'000 habitants");


  const x = d3.scaleLinear()
    .domain([0, d3.max(top10, d => d.ratio)])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(top10.map(d => d.name))
    .range([0, height])
    .padding(0.1);

  svgBar.append("g").call(d3.axisLeft(y));
  svgBar.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svgBar.selectAll("rect")
    .data(top10)
    .enter()
    .append("rect")
    .attr("y", d => y(d.name))
    .attr("height", y.bandwidth())
    .attr("x", 0)
    .attr("width", 0)
    .attr("fill", "#4682b4")
    .transition()
    .duration(12000)
    .ease(d3.easeCubicOut)
    .attr("width", d => x(d.ratio));
});





    


