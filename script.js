// Configuração para a cena, câmera e renderizador
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Posição da câmera
camera.position.set(0, 0, -30); // A câmera está atrás da nave
camera.lookAt(0, 0, 0);

const loader = new THREE.TextureLoader();
scene.background = loader.load('https://t3.ftcdn.net/jpg/03/70/74/32/360_F_370743254_qAbRG8YcWNjPVCPVOE0A7Buy8DH4yHTf.jpg');

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Carregar a textura do meteoro
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texturas/10464_Asteroid_v1_diffuse.jpg');

// Carregar o arquivo MTL e OBJ para os meteoros
const mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath('texturas/');
mtlLoader.load('10464_Asteroid_v1_Iteration-2.mtl', (materials) => {
    materials.preload();
    
    const objLoader = new THREE.OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('texturas/');
    
    // Função para criar e distribuir meteoros
    const createMeteors = () => {
        for (let i = 0; i < 40; i++) {
            objLoader.load('10464_Asteroid_v1_Iterations-2.obj', (object) => {
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.material.map = texture;
                    }
                });
                
                object.scale.set(0.003, 0.003, 0.003);
                object.position.set(
                    Math.random() * 40 - 20,
                    Math.random() * 40 - 20,
                    Math.random() * 100 + 50
                );

                // Adicionar velocidade para os meteoros
                object.userData.velocity = -(Math.random() * 0.2 + 0.1);
                scene.add(object);
            });
        }
    };

    createMeteors();
});

// Carregar a nave
let spaceship;
const spaceshipMtlLoader = new THREE.MTLLoader();
spaceshipMtlLoader.setPath('nave/');
spaceshipMtlLoader.load('saberncc61947.mtl', (materials) => {
    materials.preload();
    const spaceshipObjLoader = new THREE.OBJLoader();
    spaceshipObjLoader.setMaterials(materials);
    spaceshipObjLoader.setPath('nave/');
    spaceshipObjLoader.load('saberncc61947.obj', (object) => {
        spaceship = object;
        spaceship.scale.set(1.0, 1.0, 1.0);
        spaceship.position.set(0, 0, 0);
        spaceship.rotation.y = Math.PI - Math.PI; // Nave apontando na direção dos meteoros
        scene.add(spaceship);
    });
});

// Adicionar música de fundo
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('music/Música Tema - Interestelar .mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});

// Array para projéteis
const projectiles = [];

// Função para criar projéteis a partir dos canhões
const createProjectileFromCannons = () => {
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // fução que possiciona os projeteis 
    const cannonOffsets = [
        { x: -2.3, y: 0, z: 5.5 },  // Posição do canhão esquerdo
        { x: 2.3, y: 0, z: 5.5 }    // Posição do canhão direito
    ];

    cannonOffsets.forEach((offset) => {
        const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
        projectile.position.set(
            spaceship.position.x + offset.x,
            spaceship.position.y + offset.y,
            spaceship.position.z + offset.z
        );

        scene.add(projectile);
        projectiles.push(projectile);
    });
};

// Atualizar a posição dos projéteis
const updateProjectiles = () => {
    projectiles.forEach((projectile) => {
        projectile.position.z += 0.9;

        if (projectile.position.z > 50) {
            scene.remove(projectile);
        }
    });
};

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
        case 'w':
            spaceship.position.z += 1;
            break;
        case 's':
            spaceship.position.z -= 1;
            break;
        case ' ':
            createProjectileFromCannons(); // Disparar projéteis
            break;
    }
});

// Função para detectar colisão
function detectCollision(obj1, obj2) {
    const obj1Box = new THREE.Box3().setFromObject(obj1);
    const obj2Box = new THREE.Box3().setFromObject(obj2);
    return obj1Box.intersectsBox(obj2Box);
}

// Função para reiniciar o jogo
function restartGame() {
    spaceship.position.set(0, 0, 0);

    scene.children.forEach((child) => {
        if (child.userData.velocity) {
            child.position.z = Math.random() * 100 + 50;
            child.position.x = Math.random() * 40 - 20;
            child.position.y = Math.random() * 40 - 20;
        }
    });

    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'none';

    isGamePaused = false;
    animate();
}

// Exibir o botão de reinício
function showRestartButton() {
    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'block';
    restartButton.addEventListener('click', restartGame);
}

let isGamePaused = false;

// Loop de animação
function animate() {
    if (!isGamePaused) {
        requestAnimationFrame(animate);

        scene.children.forEach((child) => {
            if (child.userData.velocity) {
                child.position.z += child.userData.velocity;

                if (child.position.z < -50) {
                    child.position.z = Math.random() * 100 + 50;
                    child.position.x = Math.random() * 40 - 20;
                    child.position.y = Math.random() * 40 - 20;
                }

                if (spaceship && detectCollision(spaceship, child)) {
                    isGamePaused = true;
                    console.log("Colisão detectada! Jogo pausado.");
                    showRestartButton();
                }
            }
        });

        updateProjectiles();
        renderer.render(scene, camera);
    }
}

animate();
