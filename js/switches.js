function models_combobox_changed(objCombo) {    
    setCurrentModel(objCombo.value);   
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