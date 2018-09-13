

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

        return result;        
    }     
}