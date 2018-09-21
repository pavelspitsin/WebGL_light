

class ObjLoader {

    constructor() {
        this.mtlLoader = new MtlLoader();
    }

    load(path, callback_objLoaded) {

        this.loadFile(path, (fileContent) => {

            let objInfo = this.parseFile(fileContent);
            let model = new Model(objInfo.meshes);

            if (objInfo.mtlib != null) {
                this.mtlLoader.loadMaterials(objInfo.mtlib, model, () => {  
                    callback_objLoaded(model);
                });      
            }      
            else {

                let defaultMaterial = Material.createDefault();
                model.materials = [];
                model.materials[defaultMaterial.name] = defaultMaterial;      

                model.meshes.forEach(function(mesh) {
                    mesh.materialName = defaultMaterial.name;
                  });

                callback_objLoaded(model);  
            }

        });

    } 
    

    loadFile(path, callback_loaded) {

        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status !== 404) {
                callback_loaded(xhr.responseText);
            }
          }


        xhr.open('GET', './resources/Models/' + path, true);
        xhr.send();
    }



    static calculateTangents(indices, vertices, textCoords) {

        let tangents = [...new Array(vertices.length)].map(v => 0);

        for(let i = 0; i < indices.length; i+=3) {

            const i0 = indices[i];
            const i1 = indices[i + 1];
            const i2 = indices[i + 2];

            const v1 = vec3.clone([vertices[i0 * 3 + 0], vertices[i0 * 3 + 1], vertices[i0 * 3 + 2]]);
            const v2 = vec3.clone([vertices[i1 * 3 + 0], vertices[i1 * 3 + 1], vertices[i1 * 3 + 2]]);
            const v3 = vec3.clone([vertices[i2 * 3 + 0], vertices[i2 * 3 + 1], vertices[i2 * 3 + 2]]);
                                   
            const tex1 = vec2.clone([textCoords[i0 * 2 + 0], textCoords[i0 * 2 + 1]]);
            const tex2 = vec2.clone([textCoords[i1 * 2 + 0], textCoords[i1 * 2 + 1]]);
            const tex3 = vec2.clone([textCoords[i2 * 2 + 0], textCoords[i2 * 2 + 1]]);

            const edge1_x = v2[0] - v1[0];
            const edge1_y = v2[1] - v1[1];
            const edge1_z = v2[2] - v1[2];

            const edge2_x = v3[0] - v1[0];
            const edge2_y = v3[1] - v1[1];
            const edge2_z = v3[2] - v1[2];

            const deltaU1 = tex2[0] - tex1[0];
            const deltaV1 = tex2[1] - tex1[1];
            const deltaU2 = tex3[0] - tex1[0];
            const deltaV2 = tex3[1] - tex1[1];

            const f = 1.0 / (deltaU1 * deltaV2 - deltaU2 * deltaV1);

            const tangent_x = f * (deltaV2 * edge1_x - deltaV1 * edge2_x);
            const tangent_y = f * (deltaV2 * edge1_y - deltaV1 * edge2_y);
            const tangent_z = f * (deltaV2 * edge1_z - deltaV1 * edge2_z);

            tangents[i0 * 3 + 0] = tangent_x;
            tangents[i0 * 3 + 1] = tangent_y;
            tangents[i0 * 3 + 2] = tangent_z;

            tangents[i1 * 3 + 0] = tangent_x;
            tangents[i1 * 3 + 1] = tangent_y;
            tangents[i1 * 3 + 2] = tangent_z;

            tangents[i2 * 3 + 0] = tangent_x;
            tangents[i2 * 3 + 1] = tangent_y;
            tangents[i2 * 3 + 2] = tangent_z;
        }

        return tangents;
    }


    parseFile(objectData) {

        let meshes = [];
        let currentMesh = new Mesh();
        meshes.push(currentMesh);

        let mtllib = null;

        let index = 0;

        let file = {};
        file.vertices = [];
        file.texCoords = [];
        file.normals = [];

        let lines = objectData.split('\n');

        for(let i = 0; i < lines.length; ++i) {

            let line = lines[i].trim();
            let words = line.split(' ');
            let firstWord = words[0];

            switch(firstWord) {

                case 'v':
                {
                    file.vertices.push(words.slice(1, words.length))
                    break;
                }
                case 'vt':
                {
                    file.texCoords.push(words.slice(1, words.length))
                    break;
                }
                case 'vn':
                {
                    file.normals.push(words.slice(1, words.length))
                    break;
                }
                case 'mtllib':
                {
                    if (mtllib == null) {
                        mtllib = words[1];
                    }
                    else {
                        console.log("WARNING. There are more than one .mtl files.");
                    }

                    break;
                }
                case 'usemtl':
                {
                    let material = words[1];

                    if (currentMesh.materialName != null) {
                        currentMesh = new Mesh();
                        meshes.push(currentMesh);
                        index = 0;
                    }
                    
                    currentMesh.materialName = material;                    
                    break;
                }
                case 'f':
                {
                    let currentLineValue = words.slice(1, words.length);

                    let faceVertices = currentLineValue.map( (item) => {
                        return item.split('/');
                    });


                    if (faceVertices.length >= 3) {

                        
                        let triangleVertices = [];

                        if (faceVertices.length == 3) {

                            triangleVertices = faceVertices.slice();
                        }
                        else
                        {
                            // Split on triangles
                            let firstVertex = faceVertices[0];

                            for (let j = 2; j < faceVertices.length; ++j) {
                                triangleVertices.push(firstVertex);
                                triangleVertices.push(faceVertices[j-1]);
                                triangleVertices.push(faceVertices[j]);
                            }
                        }

                        for (let j = 0; j < triangleVertices.length; ++j) {

                            let vertex = triangleVertices[j];

                            currentMesh.vertices.push(file.vertices[vertex[0] - 1][0]);
                            currentMesh.vertices.push(file.vertices[vertex[0] - 1][1]);
                            currentMesh.vertices.push(file.vertices[vertex[0] - 1][2]);

                            if (vertex[1].length > 0) {
                                currentMesh.texCoords.push(file.texCoords[vertex[1] - 1][0]);
                                currentMesh.texCoords.push(file.texCoords[vertex[1] - 1][1]);
                            }

                            
                            currentMesh.normals.push(file.normals[vertex[2] - 1][0]);
                            currentMesh.normals.push(file.normals[vertex[2] - 1][1]);
                            currentMesh.normals.push(file.normals[vertex[2] - 1][2]);

                            
                            currentMesh.indices.push(index);
                            index++;
                        }

                    }
                                     

                    break;
                }
                default:
                    break;
            }
        }
        

        let result = {};
        result.mtlib = mtllib;
        result.meshes = meshes;


        for (let i = 0; i < meshes.length; i++) {
            let mesh = meshes[i];
            mesh.tangents = ObjLoader.calculateTangents(mesh.indices, mesh.vertices, mesh.texCoords);
        }
        

        return result;        
    }     
}