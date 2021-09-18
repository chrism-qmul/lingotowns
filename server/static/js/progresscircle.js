function animate(updatefn, animationlength) {
  let start;

  function step(timestamp) {
    if (start == undefined) start = timestamp;
    const elapsed = timestamp - start;
    const completion = elapsed/animationlength;
    updatefn(completion); 
    if (completion < 1.0) {
      window.requestAnimationFrame(step);
    }
  }
  window.requestAnimationFrame(step);
}

function progressradial() {
  const els = document.getElementsByClassName("progresscircle");

  for(var i = 0; i < els.length; i++) {
    const el = els[i];
    const thickness = el.dataset.thickness;
    const amount = el.dataset.amount
    const radius = Math.floor(Math.min(el.offsetWidth, el.offsetHeight)/2);
    const diameter = 2 * radius;
    const innerradius = radius - (thickness /2);
    const circumference = 2 * Math.PI * innerradius;
    const length = (1 - amount) * circumference;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    svg.appendChild(circle1);
    svg.appendChild(circle2);
    svg.appendChild(text);

    svg.setAttribute("viewBox", "0 0 " + diameter + " " +  diameter);
    svg.setAttribute("width", diameter + "px");
    svg.setAttribute("height", diameter + "px");

    circle1.setAttribute("cx", radius);
    circle1.setAttribute("cy", radius);
    circle1.setAttribute("stroke", el.dataset.bgColor);
    circle1.setAttribute("r", innerradius);
    circle1.setAttribute("fill", el.dataset.fill);
    circle1.setAttribute("stroke-width", thickness);

    circle2.setAttribute("transform", "rotate(-90 " + radius + " " + radius + ")");
    circle2.setAttribute("cx", radius);
    circle2.setAttribute("cy", radius);
    circle2.setAttribute("stroke", el.dataset.fgColor);
    circle2.setAttribute("r", innerradius);
    circle2.setAttribute("fill", "none");
    circle2.setAttribute("stroke-width", thickness);
    //circle2.setAttribute("stroke-dashoffset", length);
    circle2.setAttribute("stroke-dashoffset", 0);
    circle2.setAttribute("stroke-dasharray", circumference);

    animate(function(pc)  {
      circle2.setAttribute("stroke-dashoffset", pc*length);
    }, 1000);


    text.setAttribute("text-anchor", "middle");
    text.setAttribute("x", radius);
    text.setAttribute("y", innerradius*1.25);
    text.setAttribute("font-size", (innerradius/1.5) + "px");
    text.appendChild(document.createTextNode(el.dataset.text));
  
    els[i].appendChild(svg);
  }

  let start;

}

document.addEventListener('DOMContentLoaded', progressradial);
/*
  [:svg.countdown-circle {:width diameter
                                :height diameter
                                :viewBox viewBox}
         [:circle (assoc circle-properties :stroke bg-color)]
         [:circle (assoc circle-properties :stroke fg-color :stroke-dasharray circumference :stroke-dashoffset length)]]))

*/
