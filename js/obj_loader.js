const objectData = `
# Blender v2.79 (sub 0) OBJ File: ''
# www.blender.org
mtllib cube.mtl
o Cube_Cube.001
v -1.000000 -1.000000 1.000000
v -1.000000 1.000000 1.000000
v -1.000000 -1.000000 -1.000000
v -1.000000 1.000000 -1.000000
v 1.000000 -1.000000 1.000000
v 1.000000 1.000000 1.000000
v 1.000000 -1.000000 -1.000000
v 1.000000 1.000000 -1.000000
vn -1.0000 0.0000 0.0000
vn 0.0000 0.0000 -1.0000
vn 1.0000 0.0000 0.0000
vn 0.0000 0.0000 1.0000
vn 0.0000 -1.0000 0.0000
vn 0.0000 1.0000 0.0000
usemtl None
s off
f 1//1 2//1 4//1 3//1
f 3//2 4//2 8//2 7//2
f 7//3 8//3 6//3 5//3
f 5//4 6//4 2//4 1//4
f 3//5 7//5 5//5 1//5
f 8//6 4//6 2//6 6//6

`;




class ObjLoader {


    load() {

        let meshInfo = this.parseFile(objectData);
        let mesh = new Mesh(meshInfo.vertices, meshInfo.normals, meshInfo.indices, null, meshInfo.texCoords);

        return new Model(mesh);
    }

    parseFile(objectData) {

        let result = {};

        let vertices = [];
        let texCoords = [];
        let normals = [];
        let indices = [];

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
                    file.vertices.push(words.slice(1, words.length))
                    break;
                case 'vt':
                    //file.texCoords.push(words.slice(1, words.length))
                    break;
                case 'vn':
                    file.normals.push(words.slice(1, words.length))
                    break;
                case 'f':

                    let faceVertices = words.slice(1, words.length);

                    let quad = false;
                    let zeroVertexIndex = index;

                    for(var j = 0; j < faceVertices.length; j++) {

                        if (j == 3 && !quad) {
                            j = 2;
                            quad = true;
                        }

                        let vertex = faceVertices[j].split('/');
                      
                        vertices.push(file.vertices[vertex[0] - 1][0]);
                        vertices.push(file.vertices[vertex[0] - 1][1]);
                        vertices.push(file.vertices[vertex[0] - 1][2]);

                        if (vertex.length == 3) {
                            if (texCoords.length > 0) {
                                texCoords.push(file.texCoords[vertex[1] - 1][0]);
                                texCoords.push(file.texCoords[vertex[1] - 1][1]);
                            }

                            normals.push(file.normals[vertex[2] - 1][0]);
                            normals.push(file.normals[vertex[2] - 1][1]);
                            normals.push(file.normals[vertex[2] - 1][2]);
                        }


                        indices.push(index);
                        index++;

                        if (j == 3 && quad) {
                            indices.push(zeroVertexIndex);
                        }
                    }                   

                    break;
                default:
                    break;
            }
        }
        

        result.vertices = vertices;
        result.texCoords = texCoords;
        result.normals = normals;
        result.indices = indices;

        return result;
        
    }  
   
}