'use strict';

class CrysisAudio {
    constructor() {
        let url = './resources/Music/crysis2.ogg';
        this._crysisAudio = new Audio(url);
        this._crysisAudio.volume = 0.5;
        this.btnElement = document.getElementById('musicBtn');
    }

    audioBtnClick() {

        if (this._crysisAudio.paused) {
            this.btnElement.innerHTML = 'Music (playing)';
            this.audioPlay();
        }
        else {
            this.btnElement.innerHTML = 'Music (pause)';
            this.audioPause();
        }
    }

    hideBtn() {
        this.btnElement.style.visibility = 'hidden';
    }
    
    showBtn() {
        this.btnElement.style.visibility = 'visible';
    }

    
    audioReset() {
        document.getElementById('musicBtn').innerHTML = 'Music';
        this._crysisAudio.pause();
        this._crysisAudio.currentTime = 0; 
    }

    audioPause() {
        this._crysisAudio.pause();
    }

    audioPlay() {
        this._crysisAudio.play();
    }
}



const crysisAudio = new CrysisAudio();



function models_combobox_changed(objCombo) {    

    if (objCombo.value !== 'nanosuit') {
        crysisAudio.audioPause();
        crysisAudio.audioReset();
        crysisAudio.hideBtn();
    }
    else {        
        crysisAudio.showBtn();
    }

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
    
    crysisAudio.hideBtn();
}