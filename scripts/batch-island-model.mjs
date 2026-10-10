// Optional build-time tool. Never imported by the website.
// Use the documented SQ_GLTF_TOOLS_DIR for glTF Transform's external toolchain.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Matrix4} from 'three';
import assert from 'node:assert/strict';

const require=createRequire(resolve(process.env.SQ_GLTF_TOOLS_DIR||'.','package.json'));
const load=name=>import(pathToFileURL(require.resolve(name)).href);
const [{NodeIO},{ALL_EXTENSIONS},{dequantize,join,weld,meshopt,getBounds},{MeshoptEncoder,MeshoptDecoder}]=await Promise.all([
 load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('@gltf-transform/functions'),load('meshoptimizer'),
]);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const [input,output]=process.argv.slice(2);
assert.ok(input&&output,'Supply an input GLB and output GLB.');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(input),root=doc.getRoot(),before=getBounds(root.listScenes()[0]);
await doc.transform(dequantize());
const animated=new Set(root.listAnimations().flatMap(a=>a.listChannels().map(c=>c.getTargetNode())));
const plans=[];
for(const node of root.listNodes()){
 if(!node.getMesh()||node.getSkin()||node.listChildren().length||animated.has(node))continue;
 let parent=node.getParentNode();while(parent&&!animated.has(parent))parent=parent.getParentNode();
 if(!parent)continue;
 const local=new Matrix4().fromArray(parent.getWorldMatrix()).invert().multiply(new Matrix4().fromArray(node.getWorldMatrix()));
 plans.push({node,parent,matrix:local.toArray()});
}
// Snapshot every transform before mutation. Only leaf meshes move; all animated
// ancestors, animation targets and their hierarchy remain intact.
for(const {node,parent,matrix} of plans){node.getParentNode()?.removeChild(node);parent.addChild(node);node.setMatrix(matrix);}
await doc.transform(join({keepMeshes:false,keepNamed:false}),weld(),meshopt({encoder:MeshoptEncoder,level:'high'}));
const after=getBounds(root.listScenes()[0]);
for(const key of ['min','max'])after[key].forEach((n,i)=>assert.ok(Math.abs(n-before[key][i])<.04,'Model bounds must stay unchanged.'));
assert.equal(root.listAnimations().length,1,'The artist animation must survive optimization.');
assert.equal(root.listAnimations()[0].listChannels().length,28,'All animation channels must survive.');
await io.write(output,doc);
console.log(JSON.stringify({reparentedLeaves:plans.length,meshNodes:root.listNodes().filter(n=>n.getMesh()).length,primitives:root.listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0),animations:root.listAnimations().length,bounds:after},null,2));
