function models_combobox_changed(objCombo) {

    switch(objCombo.value)
    {
        case 'cube':
        {
            _state.currentModel = _models.cube;
            _camera.lookAt([0, 2, 6], [0, 0, 0], [0, 1, 0]);
            setCameraAttributes(gl, [0, 2, 6]);

            break;
        }
        case 'nanosuit':
        {
            _state.currentModel = _models.nanosuit;
            _camera.lookAt([0.0, 13.0, 19.0], [0.0, 8.0, 0.0], [0, 1, 0]);
            setCameraAttributes(gl, [0, 2, 6]);
            
            break;
        }
        default:
            break;
    }
}

function rotate_checkbox_changed() {
    _state.isRotate = !_state.isRotate;
}

function diffuse_checkbox_changed() {
    _state.isUseDiffuseMap = !_state.isUseDiffuseMap;
}

function normal_checkbox_changed() {
    _state.isUseNormalMap = !_state.isUseNormalMap;
}


function initSwitches() {
    document.getElementById('models_combobox').value = 'cube';
    document.getElementById('rotate_checkbox').checked = _state.isRotate;
    document.getElementById('diffuse_checkbox').checked = _state.isUseDiffuseMap;
    document.getElementById('normal_checkbox').checked = _state.isUseNormalMap;
}