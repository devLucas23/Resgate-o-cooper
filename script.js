// Configuração para a cena, câmera e renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// posição da câmera
camera.position.set(0, 0, -30); // A câmera está agora atrás da nave, olhando para a frente (eixo Z positivo).
camera.lookAt(0, 0, 0);

const loader = new THREE.TextureLoader();
scene.background = loader.load( 'https://t3.ftcdn.net/jpg/03/70/74/32/360_F_370743254_qAbRG8YcWNjPVCPVOE0A7Buy8DH4yHTf.jpg' );
// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Carregar a textura 
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texturas/10464_Asteroid_v1_diffuse.jpg');

// Carregar o arquivo MTL e o arquivo OBJ
const mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath('texturas/');
mtlLoader.load('10464_Asteroid_v1_Iteration-2.mtl', (materials) => {
    materials.preload();
    
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('texturas/');
    
    // Função para criar e distribuir vários meteoros
    const createMeteors = () => {
        for (let i = 0; i < 40; i++) { // Ajuste a quantidade de meteoros
            objLoader.load('10464_Asteroid_v1_Iterations-2.obj', (object) => {
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.material.map = texture;
                    }
                });
                
                object.scale.set(0.003, 0.003, 0.003); // tamanho dos meteoros
                object.position.set(
                    Math.random() * 40 - 20, // Distribuir no eixo X
                    Math.random() * 40 - 20, // Distribuir no eixo Y
                    Math.random() * 100 + 50 // Iniciar à frente da nave no eixo Z
                );

                // Adicionar velocidade para os meteoros virem na direção da nave
                object.userData.velocity = -(Math.random() * 0.2 + 0.1);
                scene.add(object);
            });
        }
    };

    createMeteors();
});

// Carregar e adicionar a nave ao cenário
let spaceship;
const spaceshipMtlLoader = new THREE.MTLLoader();
spaceshipMtlLoader.setPath('texturas/');
spaceshipMtlLoader.load('neghvar.mtl', (materials) => {
    materials.preload();
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('texturas/10464_Asteroid_v1_diffuse.jpg');
    const spaceshipObjLoader = new THREE.OBJLoader();
    spaceshipObjLoader.setMaterials(materials);
    spaceshipObjLoader.setPath('texturas/');
    spaceshipObjLoader.load('neghvar.obj', (object) => {
        spaceship = object;
        spaceship.scale.set(0.5, 0.5, 0.5); // Ajuste de escala da nave
        spaceship.position.set(0, 0, 0); // Posição inicial da nave
        
        // nave apontada na direção dos meteoros
        spaceship.rotation.y = Math.PI - Math.PI;

        scene.add(spaceship);
    });
});
// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add( listener );

// create a global audio source
const sound = new THREE.Audio( listener );

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load( 'music/Música Tema - Interestelar .mp3', function( buffer ) {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0.5 );
	sound.play();
});

// Controle da nave
window.addEventListener('keydown', (event) => {
    if (!spaceship) return;
    
    switch (event.key) {
        case 'ArrowUp':
            spaceship.position.y += 1;
            break;
        case 'ArrowDown':
            spaceship.position.y -= 1;
            break;
        case 'ArrowLeft':
            spaceship.position.x += 1;
            break;
        case 'ArrowRight':
            spaceship.position.x -= 1;
            break;
    }
});

// Loop de animação
let isGamePaused = false;

// Função simples de detecção de colisão
function detectCollision(obj1, obj2) {
    const obj1Box = new THREE.Box3().setFromObject(obj1);
    const obj2Box = new THREE.Box3().setFromObject(obj2);
    return obj1Box.intersectsBox(obj2Box);
}

// Exibir o botão de reinício quando o jogo for pausado
function showRestartButton() {
    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'block'; // Exibe o botão
    restartButton.addEventListener('click', restartGame); // Adiciona evento de clique
}

// Função para reiniciar o jogo
function restartGame() {
    // Resetar a posição da nave
    spaceship.position.set(0, 0, 0);

    // Resetar a posição dos meteoros
    scene.children.forEach((child) => {
        if (child.userData.velocity) {
            child.position.z = Math.random() * 100 + 50;
            child.position.x = Math.random() * 40 - 20;
            child.position.y = Math.random() * 40 - 20;
        }
    });

    // Ocultar o botão de reinício
    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'none';

    isGamePaused = false; // Retomar o jogo
    animate(); // Recomeçar a animação
}

// Loop de animação
function animate() {
    if (!isGamePaused) {
        requestAnimationFrame(animate);

        // Atualizar a posição dos meteoros
        scene.children.forEach((child) => {
            if (child.userData.velocity) {
                child.position.z += child.userData.velocity;

                // Resetar o meteoro quando ele passa pela nave
                if (child.position.z < -50) {
                    child.position.z = Math.random() * 100 + 50;
                    child.position.x = Math.random() * 40 - 20;
                    child.position.y = Math.random() * 40 - 20;
                }

                // Verificar colisão com a nave
                if (spaceship && detectCollision(spaceship, child)) {
                    isGamePaused = true; // Pausar o jogo
                    console.log("Colisão detectada! Jogo pausado.");
                    showRestartButton(); // Mostrar o botão de reinício
                }
            }
        });

        renderer.render(scene, camera);
    }
}

animate();
