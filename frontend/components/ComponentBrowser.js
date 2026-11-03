import { LAYER_CATALOG } from "./Constants.js";

export function initComponentBrowser(onAdd) {
    const palette = document.getElementById("paletteList");
    const search = document.getElementById("layerSearch");
    const emptyResult = document.getElementById("noSearchResults");

    palette.replaceChildren();

    const groups = new Map();
    const entries = [];

    for (const [type, definition] of Object.entries(LAYER_CATALOG)) {
        let group = groups.get(definition.group);

        if (!group) {
            const section = document.createElement("section");
            section.className = "category-group";

            const heading = document.createElement("h3");
            heading.className = "category-title";
            heading.textContent = definition.group;

            section.append(heading);
            palette.append(section);

            group = { section, cards: []}
            groups.set(definition.group, group);
        }

        const card = document.createElement("button");
        card.type = "button";
        card.className = "layer-card";
        card.draggable = true;
        card.dataset.type = type;
        card.dataset.kind = definition.kind;
        card.title = definition.description;
        card.setAttribute("aria-label", `Add ${type}`);

        const info = document.createElement("span");
        info.className = "layer-info";

        const badge = document.createElement("span");
        badge.className = `layer-icon-badge ${definition.badgeClass}`;
        badge.textContent = definition.code;
        badge.setAttribute("aria-hidden", "true");

        const name = document.createElement("span");
        name.className = "layer-name";
        name.textContent = type;

        const addMark = document.createElement("span");
        addMark.className = "drag-handle";
        addMark.textContent = "+";
        addMark.setAttribute("aria-hidden", "true");

        info.append(badge, name);
        card.append(info, addMark);
        card.addEventListener("click", () => onAdd(type));
        group.section.append(card);

        group.cards.push(card);
        entries.push({
            card, searchText: [
                type, definition.group, definition.kind, definition.description,
            ].join(" ").toLowerCase()
        });
    }

    function filterOperators() {
        const query = search.value.trim().toLowerCase();
        let visibleCount = 0;

        for (const {card, searchText} of entries){
            card.hidden = !searchText.includes(query);
            if (!card.hidden) visibleCount++;
        }

        for (const {section , cards} of groups.values()) {
            section.hidden = cards.every(card => card.hidden);
        }

        emptyResult.hidden = visibleCount > 0;
    }

    search.addEventListener("input", filterOperators);
    filterOperators()
}