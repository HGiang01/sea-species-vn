import L from "leaflet";

const createSvgIcon = (svgString: string, size = 32, className = "") => {
    const responsiveSvg = svgString.replace(/width=".*?"/, 'width="100%"').replace(/height=".*?"/, 'height="100%"');

    const html = `
    <div class="svg-icon-wrapper" style="width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
      ${responsiveSvg}
    </div>
  `;

    return L.divIcon({
        html: html,
        className: `custom-div-icon ${className}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
};

export default createSvgIcon;
