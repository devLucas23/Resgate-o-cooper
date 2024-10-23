import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

// Configuração para a cena, câmeras e renderizador
const scene = new THREE.Scene();
const mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const personCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let activeCamera = mainCamera; // Define a câmera inicial como a câmera principal
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Posição da câmera principal (atrás da nave)
mainCamera.position.set(0, 0, -30);
mainCamera.lookAt(0, 0, 0);

// Posição da câmera em primeira pessoa (dentro da nave)
personCamera.position.set(0, 2, 5); // Ajuste conforme necessário para a posição correta dentro da nave
personCamera.lookAt(0, 2, 10);

// Background
//const loader = new THREE.TextureLoader();
//scene.background = loader.load('texturas/buraco negro.jpg');

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Textura do Meteoro
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texturas/10464_Asteroid_v1_diffuse.jpg');

// Arrays para armazenar meteoros e projéteis
const meteors = [];
const projectiles = [];
let pontuacao = 0;

// Carregar o arquivo MTL e OBJ para os meteoros
const mtlLoader = new MTLLoader();
mtlLoader.setPath('texturas/');
mtlLoader.load('10464_Asteroid_v1_Iteration-2.mtl', (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
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

                object.scale.set(0.004, 0.004, 0.004);
                object.position.set(
                    Math.random() * 40 - 20,
                    Math.random() * 40 - 20,
                    Math.random() * 100 + 50
                );

                // Adicionar velocidade para os meteoros
                object.userData.velocity = -(Math.random() * 0.2 + 0.1);
                scene.add(object);
                meteors.push(object); // Adiciona o meteoro ao array de meteoros
            });
        }
    };

    createMeteors();
});

// Carregar a nave
let spaceship;
const spaceshipMtlLoader = new MTLLoader();
spaceshipMtlLoader.setPath('nave/');
spaceshipMtlLoader.load('saberncc61947.mtl', (materials) => {
    materials.preload();
    const spaceshipObjLoader = new OBJLoader();
    spaceshipObjLoader.setMaterials(materials);
    spaceshipObjLoader.setPath('nave/');
    spaceshipObjLoader.load('saberncc61947.obj', (object) => {
        spaceship = object;
        spaceship.scale.set(1.0, 1.0, 1.0);
        spaceship.position.set(0, 0, 0);
        scene.add(spaceship);
    });
});

// Carregar o buraco negro
const buracoloader = new GLTFLoader();
buracoloader.setPath('nave/'); // Ajuste o caminho conforme necessário
buracoloader.load('blackhole.glb', (gltf) => {
    const blackHoleMesh = gltf.scene;

    // Habilitar sombreamento
    blackHoleMesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    blackHoleMesh.scale.set(60, 60, 60);
    blackHoleMesh.position.set(0, -10, 200); // Ajuste a posição conforme necessário
    scene.add(blackHoleMesh);
});

// Adicionar música de fundo
const listener = new THREE.AudioListener();
mainCamera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('music/Música Tema - Interestelar .mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
    sound.play();
});

// Função para criar projéteis a partir dos canhões
function createProjectileFromCannons () {
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Posições dos canhões
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
function updateProjectiles () {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.position.z += 0.9;

        // Remover projétil se sair da cena
        if (projectile.position.z > 50) {
            scene.remove(projectile);
            projectiles.splice(i, 1);
        }
    }
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
        case 'c':
                // Alternar entre a câmera principal e a câmera de 1ª pessoa
             activeCamera = (activeCamera === mainCamera) ? personCamera : mainCamera;
             break;
    }
});

// Função para detectar colisão
function detectCollision(obj1, obj2) {
    const obj1Box = new THREE.Box3().setFromObject(obj1); // Caixas de colisão "Box3"
    const obj2Box = new THREE.Box3().setFromObject(obj2); // setFromObject = usa as dimensões do objeto escolhido
    return obj1Box.intersectsBox(obj2Box); // Retorna true se houver interseção
}

// Função para reiniciar o jogo
function restartGame() {
    spaceship.position.set(0, 0, 0); // Coloca a nave no centro

    scene.children.forEach((child) => {
        if (child.userData.velocity) {
            child.position.z = Math.random() * 100 + 50;
            child.position.x = Math.random() * 40 - 20;
            child.position.y = Math.random() * 40 - 20;
        }
    }); // Reinicia a geração de meteoros

    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'none'; // Esconde o botão de reiniciar
    pontuacao = 0;
    refreshPoints();

    isGamePaused = false;
    animate();
}

// Exibir o botão de reiniciar
function showRestartButton() {
    const restartButton = document.getElementById('restartButton');
    restartButton.style.display = 'block'; // Mostra o botão de reiniciar
    restartButton.addEventListener('click', restartGame); // Adiciona a função de reiniciar ao botão
}

function refreshPoints() {
    const pontuacaoElement = document.getElementById('pontuacao');
    if (pontuacaoElement) {
        pontuacaoElement.innerText = "Pontuação: " + pontuacao;
    }
}

let isGamePaused = false;

// Loop de animação
function animate() {
    if (!isGamePaused) { // O jogo é pausado quando acontece uma colisão com a nave
        requestAnimationFrame(animate);

        // Atualizar posição dos meteoros
        meteors.forEach((meteor) => {
            meteor.position.z += meteor.userData.velocity;

            if (meteor.position.z < -50) {
                meteor.position.z = Math.random() * 100 + 50;
                meteor.position.x = Math.random() * 40 - 20;
                meteor.position.y = Math.random() * 40 - 20;
            }

            // Usando a função de colisão nos meteoros contra a nave
            if (spaceship && detectCollision(spaceship, meteor)) {
                isGamePaused = true; // Pausa o jogo se houver colisão com a nave
                console.log("Colisão detectada com a nave! Jogo pausado.");
                showRestartButton(); // Mostra o botão de reiniciar
            }
        });

        // Atualizar e verificar colisões entre projéteis e meteoros
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];

            for (let j = meteors.length - 1; j >= 0; j--) {
                const meteor = meteors[j];

                if (detectCollision(projectile, meteor)) {
                    // Remover projétil da cena e do array
                    scene.remove(projectile);
                    projectiles.splice(i, 1);

                    // Resetar posição do meteoro
                    meteor.position.set(
                        Math.random() * 40 - 20,
                        Math.random() * 40 - 20,
                        Math.random() * 100 + 50
                    );

                    pontuacao += 1;
                    refreshPoints();
                    console.log("Meteoro destruído! Pontuação: " + pontuacao);
                    break; // Interrompe o loop de meteoros para este projétil
                }
            }
        }

        // Atualizar a posição da câmera em primeira pessoa para seguir a nave no eixo Z
        if (activeCamera === personCamera) {
            personCamera.position.set(spaceship.position.x, spaceship.position.y + 2, spaceship.position.z + 5);
            personCamera.lookAt(spaceship.position.x, spaceship.position.y + 2, spaceship.position.z + 10);
        }

        updateProjectiles(); // Atualiza a posição dos projéteis
        renderer.render(scene, activeCamera); // Renderiza a cena
    }
}

animate();
