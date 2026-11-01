/* Standalone design reference. Production model logic remains in main.js. */
const $=s=>document.querySelector(s);
const studies = {
    neuralpaper: ['Neural architecture playground', 'Trace tensor flow on a warm paper canvas. Inspect and refine each operator.', 'TensorFlow Playground-inspired horizontal flow, with Paper / clay surfaces, copper selection markers, and the SageMaker-style inspector. Edges represent tensor flow; no training is executed.'],
    tensorflow: ['Neural architecture playground', 'Follow the tensors from input to output. Adjust an operator to inspect how its contract changes.', 'Inspired by TensorFlow Playground’s shared control strip and left-to-right network view. Blue identifies input; orange marks the terminal output. Edges represent tensor flow, not learned weights.'],
    paper: ['Spatial encoder', 'Inspect operators, trace tensor dimensions, and refine the architecture.', 'Clay paper, graphite framing and copper selection markers. Shape estimates assume channel-first tensors and the supported operator defaults.'],
    gallery: ['Spatial encoder', 'A slate workspace with cool ink and a measured information hierarchy.', 'Slate canvas, blue-grey panels and blue selection markers. Values are derived from this local graph; no experiment has been run.'],
    notebook: ['Spatial encoder', 'A technical notebook for architecture decisions and tensor contracts.', 'Ochre paper, ruled canvas and dark ink. Parameters and tensor shapes remain adjacent to the operators they describe.'],
    sage: ['Spatial encoder', 'Trace the model through a quiet, structured drafting workspace.', 'A deep sage board with muted cards and orthogonal connections. This is an architecture preview, not a training environment.']
};
const defs=[['Input','IN','Input & reshaping','Your model’s starting tensor.',{
    shape:'3 × 224 × 224'
}
],['Flatten','FL','Input & reshaping','Turn spatial dimensions into a vector.',{
    start_dim:'1'
}
],['Conv2d','C2','Convolutional','Find spatial patterns in your input.',{
    in_channels:'3',out_channels:'32',kernel_size:'3',stride:'1',padding:'1'
}
],['MaxPool2d','MP','Convolutional','Reduce spatial resolution.',{
    kernel_size:'2',stride:'2'
}
],['Linear','FC','Linear & normalization','Project features into a new space.',{
    in_features:'128',out_features:'10'
}
],['Dropout','DO','Linear & normalization','Regularize by dropping activations.',{
    p:'0.5'
}
],['BatchNorm2d','BN','Linear & normalization','Normalize across feature channels.',{
    num_features:'32'
}
],['ReLU','RL','Activations','Keep positive activations.',{
    inplace:'false'
}
],['Softmax','SM','Activations','Normalize scores into probabilities.',{
    dim:'1'
}
]];
let nodes=[],edges=[],selected=1,serial=5,connecting=null,elbow=false;
let spatialPositions = null;
function definition(type){
    return defs.find(d=>d[0]===type)
}
function reset(){
    nodes=[['Input',38,90],['Conv2d',278,90],['ReLU',518,90],['MaxPool2d',518,300],['Flatten',278,300]].map(([type,x,y],id)=>({
        id,type,x,y,params:{
            ...definition(type)[4]
        }
    }
    ));
    edges=[[0,1],[1,2],[2,3],[3,4]];
    selected=1;
    serial=5;
    connecting=null;
    if (['tensorflow', 'neuralpaper'].includes(document.documentElement.dataset.theme)) {
        spatialPositions = new Map(nodes.map(node => [node.id, { x: node.x, y: node.y }]));
        arrangePlaygroundFlow();
    } else {
        render();
    }
}
function theme(key){
    if(!studies[key])key='paper';
    document.documentElement.dataset.theme=key;
    document.querySelectorAll('#themes button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===key)));
    const [title,description,note]=studies[key];
    $('#title').textContent=title;
    $('#description').textContent=description;
    $('#note').textContent=note;
    elbow=key==='sage';
    $('#routing').textContent=elbow?'Elbow lines':'Curved lines';
    history.replaceState(null,'',`#${key}`);
    setPlaygroundLayout(key);
    draw()
}
function palette(query=''){
    const list=$('#layers');
    list.replaceChildren();
    let group='';
    defs.filter(d=>d[0].toLowerCase().includes(query.toLowerCase())).forEach(d=>{
        if(group!==d[2]){
            const title=document.createElement('div');
            title.className='category';
            applyNodeGroup(title, nodeGroup(d[0]));
            title.textContent=d[2];
            list.append(title);
            group=d[2]
        }
        const b=document.createElement('button');
        b.className='layer';
        const kind = nodeGroup(d[0]);
        applyNodeGroup(b, kind);
        b.title = `${NODE_GROUPS[kind].label}: ${d[0]}`;
        b.innerHTML=`<span class="symbol">${d[1]}</span><b>${d[0]}</b><span>+</span>`;
        b.onclick=()=>{
            const id=serial++;
            nodes.push({
                id,type:d[0],x:40+(id%3)*235,y:510+Math.floor((id-5)/3)*155,params:{
                    ...d[4]
                }
            }
            );
            selected=id;
            render();
            document.getElementById(`n${id}`).scrollIntoView({
                behavior:'smooth',block:'nearest',inline:'nearest'
            }
            )
        }
        ;
        list.append(b)
    }
    )
}
function size(){
    $('#graph').style.width=`${Math.max(730,...nodes.map(n=>n.x+210))}px`;
    $('#graph').style.height=`${Math.max(470,...nodes.map(n=>n.y+150))}px`
}
function render(){
    $('#nodes').replaceChildren();
    nodes.forEach(n=>{
        const d=definition(n.type),card=document.createElement('article');
        card.className=`node${n.id===selected?' selected':''}`;
        card.id=`n${n.id}`;
        const kind = nodeGroup(n.type, n.kind);
        applyNodeGroup(card, kind);
        card.style.left=`${n.x}px`;
        card.style.top=`${n.y}px`;
        card.innerHTML=`<span class="index">${NODE_GROUPS[kind].label.toUpperCase()} · ${String(n.id+1).padStart(2,'0')}</span><button class="socket input" aria-label="Connect to ${n.type}"></button><div class="node-head"><span class="symbol">${d[1]}</span><div><strong>${n.type}</strong><small>${n.type.toLowerCase()}_${n.id+1}</small></div></div><div class="node-body"><span></span><b></b></div><button class="socket output" aria-label="Connect from ${n.type}"></button>`;
        card.querySelector('.node-body span').textContent=Object.keys(n.params)[0];
        card.querySelector('.node-body b').textContent=Object.values(n.params)[0];
        card.onclick=()=>{
            selected=n.id;
            select()
        }
        ;
        card.querySelector('.output').onpointerdown=e=>{
            e.preventDefault();
            e.stopPropagation();
            connecting=n.id
        }
        ;
        card.querySelector('.input').onpointerup=e=>{
            e.stopPropagation();
            if(connecting!==null&&connecting!==n.id&&!edges.some(([a,b])=>a===connecting&&b===n.id))edges.push([connecting,n.id]);
            connecting=null;
            draw();
            inspect()
        }
        ;
        const handle=card.querySelector('.node-head');
        handle.onpointerdown=e=>{
            if(e.button!==0)return;
            selected=n.id;
            select();
            const start={
                x:e.clientX,y:e.clientY,nx:n.x,ny:n.y
            }
            ;
            handle.setPointerCapture(e.pointerId);
            handle.onpointermove=ev=>{
                n.x=Math.max(15,start.nx+ev.clientX-start.x);
                n.y=Math.max(30,start.ny+ev.clientY-start.y);
                card.style.left=`${n.x}px`;
                card.style.top=`${n.y}px`;
                size();
                draw()
            }
            ;
            handle.onpointerup=()=>{
                handle.onpointermove=null
            }
            ;
            handle.onlostpointercapture=()=>{
                handle.onpointermove=null
            }
        }
        ;
        $('#nodes').append(card)
    }
    );
    size();
    draw();
    inspect()
}
function point(id,side){
    const r=document.querySelector(`#n${id} .${side}`).getBoundingClientRect(),base=$('#graph').getBoundingClientRect();
    return{
        x:r.left-base.left+r.width/2,y:r.top-base.top+r.height/2
    }
}
function path(a,b){
    if(elbow){
        const mid=(a.x+b.x)/2;
        return `M${a.x},${a.y} H${mid} V${b.y} H${b.x}`
    }
    const bend=Math.max(65,Math.abs(b.x-a.x)*.48);
    return `M${a.x},${a.y} C${a.x+bend},${a.y} ${b.x-bend},${b.y} ${b.x},${b.y}`
}
function draw(pointer){
    const svg=$('#wires');
    svg.replaceChildren();
    edges.forEach(([a,b],i)=>{
        const wire=document.createElementNS('http://www.w3.org/2000/svg','path');
        wire.setAttribute('d',path(point(a,'output'),point(b,'input')));
        wire.setAttribute('class','wire');
        wire.setAttribute('tabindex','0');
        wire.setAttribute('role','button');
        wire.setAttribute('aria-label',`Remove connection from layer ${a+1} to ${b+1}`);
        const remove=()=>{
            edges.splice(i,1);
            draw();
            inspect()
        }
        ;
        wire.onclick=remove;
        wire.onkeydown=e=>{
            if(e.key==='Delete'||e.key==='Backspace'){
                e.preventDefault();
                remove()
            }
        }
        ;
        svg.append(wire)
    }
    );
    if(connecting!==null&&pointer){
        const wire=document.createElementNS(svg.namespaceURI,'path');
        wire.setAttribute('class','wire temp');
        wire.setAttribute('d',path(point(connecting,'output'),pointer));
        svg.append(wire)
    }
    $('#status').textContent=`${nodes.length} operators · ${edges.length} directed edges`;
    refreshResearch();
}
function select(){
    document.querySelectorAll('.node').forEach(c=>c.classList.toggle('selected',c.id===`n${selected}`));
    inspect()
}
function inspect(){
    const n=nodes.find(n=>n.id===selected),d=definition(n.type);
    $('#details').innerHTML=`<span class="symbol">${d[1]}</span><div class="eyebrow">SELECTED LAYER</div><h2>${n.type}</h2><p>${d[3]}</p><h3>Parameters</h3>`;
    Object.entries(n.params).forEach(([key,value])=>{
        const label=document.createElement('label');
        label.className='param';
        const text=document.createElement('span');
        text.textContent=key;
        const input=document.createElement('input');
        input.value=value;
        input.setAttribute('aria-label',key);
        input.oninput=()=>{
            n.params[key]=input.value;
            document.querySelector(`#n${n.id} .node-body b`).textContent=Object.values(n.params)[0]; refreshResearch();
        }
        ;
        label.append(text,input);
        $('#details').append(label)
    }
    );
    $('#links').replaceChildren();
    edges.filter(([a,b])=>a===selected||b===selected).forEach(([a,b])=>{
        const row=document.createElement('div');
        row.className='connection';
        row.textContent=`${nodes.find(n=>n.id===a).type} → ${nodes.find(n=>n.id===b).type}`;
        $('#links').append(row)
    }
    );
    if(!$('#links').children.length)$('#links').textContent='No connections yet.';
    refreshResearch();
}
document.querySelectorAll('#themes button').forEach(b=>b.onclick=()=>theme(b.dataset.theme));
$('#search').oninput=e=>palette(e.target.value);
$('#reset').onclick=reset;
$('#routing').onclick=()=>{
    elbow=!elbow;
    $('#routing').textContent=elbow?'Elbow lines':'Curved lines';
    draw()
}
;
document.addEventListener('pointermove',e=>{
    if(connecting===null)return;
    const r=$('#graph').getBoundingClientRect();
    draw({
        x:e.clientX-r.left,y:e.clientY-r.top
    }
    )
}
);
document.addEventListener('pointerup',()=>{
    connecting=null;
    draw()
}
);
document.addEventListener('pointercancel',()=>{
    connecting=null;
    draw()
}
);
document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
        connecting=null;
        draw()
    }
}
);
$('#summary').onclick=()=>{
    $('pre').textContent=`${$('.document input').value}\n\nLayers\n${nodes.map(n=>`${
        n.id+1
    }
    . ${
        n.type
    }
    : ${
        JSON.stringify(n.params)
    }
    `).join('\n')}\n\nConnections\n${edges.map(([a,b])=>`${
        a+1
    }
    → ${
        b+1
    }
    `).join('\n')}`;
    $('dialog').showModal()
}
;
$('#close').onclick=()=>$('dialog').close();
window.addEventListener('resize',()=>draw());
window.addEventListener('hashchange',()=>theme(location.hash.slice(1)));
palette();
reset();
theme(location.hash.slice(1)||document.documentElement.dataset.theme||'paper');

/** Infer a conservative channel-first contract for this local operator preview.
 * Unsupported, invalid, cyclic or multi-input paths stay unresolved.
 * Counts include Conv2d/Linear biases and BatchNorm affine parameters.
 */
function evaluateResearch(graphNodes, graphEdges) {
    const results = new Map();
    const visiting = new Set();
    const integer = value => /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) ? Number(value) : NaN;
    function visit(node) {
        if (results.has(node.id)) return results.get(node.id);
        if (visiting.has(node.id)) return { input: null, output: null, params: null, note: 'Cycle detected; shape unresolved.' };
        visiting.add(node.id);
        const parents = graphEdges.filter(([, target]) => target === node.id);
        const parent = parents.length === 1 ? graphNodes.find(n => n.id === parents[0][0]) : null;
        const input = parent ? visit(parent).output : null;
        const p = node.params;
        let output = null, params = 0, note = 'Derived from this graph. Batch dimension omitted.';
        if (node.type === 'Input' && parents.length === 0) {
            const dims = String(p.shape).replace(/[()\[\]]/g, '').split(/[×x,]/).map(v => integer(v.trim()));
            if (dims.length && dims.every(v => v > 0)) output = dims;
        } else if (input && parents.length === 1) {
            if (node.type === 'Conv2d' && input.length === 3) {
                const cin = integer(p.in_channels), cout = integer(p.out_channels);
                const k = integer(p.kernel_size), s = integer(p.stride), pad = integer(p.padding);
                if (cin === input[0] && cout > 0 && k > 0 && s > 0 && pad >= 0) {
                    output = [cout, ...input.slice(1).map(d => Math.floor((d + 2 * pad - k) / s + 1))];
                    params = cout * (cin * k * k + 1);
                }
            } else if (node.type === 'MaxPool2d' && input.length === 3) {
                const k = integer(p.kernel_size), s = integer(p.stride);
                if (k > 0 && s > 0) output = [input[0], ...input.slice(1).map(d => Math.floor((d - k) / s + 1))];
            } else if (node.type === 'Flatten') {
                const start = integer(p.start_dim) - 1;
                if (start >= 0 && start < input.length) output = [...input.slice(0, start), input.slice(start).reduce((a, b) => a * b, 1)];
            } else if (node.type === 'Linear') {
                const cin = integer(p.in_features), cout = integer(p.out_features);
                if (cin === input[input.length - 1] && cout > 0) {
                    output = [...input.slice(0, -1), cout];
                    params = (cin + 1) * cout;
                }
            } else if (node.type === 'BatchNorm2d' && input.length === 3 && integer(p.num_features) === input[0]) {
                output = [...input]; params = input[0] * 2;
            } else if (node.type === 'ReLU' && ['true', 'false'].includes(p.inplace)) {
                output = [...input];
            } else if (node.type === 'Dropout' && String(p.p).trim() !== '' && Number(p.p) >= 0 && Number(p.p) <= 1) {
                output = [...input];
            } else if (node.type === 'Softmax' && Number.isInteger(Number(p.dim)) && String(p.dim).trim() !== '' && Number(p.dim) >= -input.length - 1 && Number(p.dim) <= input.length) {
                output = [...input];
            }
        }
        if (!output || !output.every(d => Number.isSafeInteger(d) && d > 0) || !Number.isSafeInteger(params)) {
            output = null; params = null;
            note = parents.length > 1 ? 'Multiple inputs require an explicit merge operator.' : 'Check parameters and upstream connections. Shape unresolved.';
        }
        visiting.delete(node.id);
        const result = { input, output, params, note };
        results.set(node.id, result);
        return result;
    }
    graphNodes.forEach(visit);
    return results;
}

function refreshResearch() {
    if (!$('#metricNodes')) return;
    updatePlaygroundControls();
    const results = evaluateResearch(nodes, edges);
    const shape = dims => dims ? dims.map(d => d.toLocaleString('en-GB')).join(' × ') : 'Unresolved';
    const unresolved = [...results.values()].filter(r => !r.output).length;
    const terminal = nodes.filter(n => !edges.some(([from]) => from === n.id));
    const known = [...results.values()].reduce((sum, r) => sum + (r.params || 0), 0);
    $('#metricNodes').textContent = nodes.length;
    $('#metricParams').textContent = known.toLocaleString('en-GB') + (unresolved ? ' + ?' : '');
    $('#metricShape').textContent = terminal.length === 1 ? shape(results.get(terminal[0].id).output) : `${terminal.length} terminals`;
    $('#metricValidation').textContent = unresolved ? `${unresolved} unresolved` : 'Derived';
    nodes.forEach(n => {
        const card = document.getElementById(`n${n.id}`);
        if (!card) return;
        card.querySelector('.node-body span').textContent = 'out';
        card.querySelector('.node-body b').textContent = shape(results.get(n.id).output);
    });
    const selectedResult = results.get(selected);
    const contract = $('#tensorContract');
    contract.replaceChildren();
    for (const [label, value] of [
        ['Input', selectedResult.input ? shape(selectedResult.input) : '—'],
        ['Output', shape(selectedResult.output)],
        ['Parameters', selectedResult.params === null ? 'Unresolved' : selectedResult.params.toLocaleString('en-GB')]
    ]) {
        const row = document.createElement('div'); row.className = 'tensor-row';
        const term = document.createElement('dt'); term.textContent = label;
        const description = document.createElement('dd'); description.textContent = value;
        row.append(term, description); contract.append(row);
    }
    $('#inferenceNote').textContent = selectedResult.note;
}

/** Preserve the free-form research layout when entering/exiting the flow study. */
function setPlaygroundLayout(key) {
    if (key === 'tensorflow' || key === 'neuralpaper') {
        if (!spatialPositions) spatialPositions = new Map(nodes.map(node => [node.id, { x: node.x, y: node.y }]));
        arrangePlaygroundFlow();
    } else if (spatialPositions) {
        nodes.forEach(node => {
            const saved = spatialPositions.get(node.id);
            if (saved) Object.assign(node, saved);
        });
        spatialPositions = null;
        render();
    }
}

function arrangePlaygroundFlow() {
    // Respect graph dependencies where possible; cyclic remnants retain stable order.
    const remaining = [...nodes], ordered = [];
    while (remaining.length) {
        const index = remaining.findIndex(node => edges.every(([from, to]) => to !== node.id || ordered.some(item => item.id === from)));
        ordered.push(...remaining.splice(index < 0 ? 0 : index, 1));
    }
    ordered.forEach((node, index) => { node.x = 40 + index * 235; node.y = 110; });
    render();
}

function updatePlaygroundControls() {
    const input = document.getElementById('playgroundInput');
    if (!input) return;
    const source = nodes.find(node => node.type === 'Input');
    input.disabled = !source;
    if (source && document.activeElement !== input) input.value = source.params.shape;
    document.getElementById('playgroundRouting').value = elbow ? 'elbow' : 'curve';
    nodes.forEach(node => {
        const card = document.getElementById(`n${node.id}`);
        if (!card) return;
        card.classList.toggle('flow-source', node.type === 'Input');
        card.classList.toggle('flow-terminal', !edges.some(([from]) => from === node.id));
    });
}

$('#playgroundInput').addEventListener('input', event => {
    const source = nodes.find(node => node.type === 'Input');
    if (!source) return;
    source.params.shape = event.target.value;
    refreshResearch();
    if (source.id === selected) inspect();
});
$('#playgroundRouting').addEventListener('change', event => {
    elbow = event.target.value === 'elbow';
    $('#routing').textContent = elbow ? 'Elbow lines' : 'Curved lines';
    draw();
});
$('#arrangeFlow').addEventListener('click', arrangePlaygroundFlow);
updatePlaygroundControls();
