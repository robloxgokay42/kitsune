// Firebase SDK modüllerini import ediyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Firebase config kodun buraya geliyor
const firebaseConfig = {
    apiKey: "AIzaSyBteeGvXCW0H0Hxfc8P18AFpycInAXs8Fs",
    authDomain: "kitsuneanime-eddc6.firebaseapp.com",
    projectId: "kitsuneanime-eddc6",
    storageBucket: "kitsuneanime-eddc6.firebasestorage.app",
    messagingSenderId: "1073068949493",
    appId: "1:1073068949493:web:d77b25a795f40974886abc",
    measurementId: "G-RPM6XWLH8D"
};

// Firebase servislerini başlatıyoruz
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Sadece Türkiye'den erişim kontrolü
async function checkCountry() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data.country_code !== 'TR') {
            document.querySelector('.restriction-overlay').style.display = 'flex';
        } else {
            document.querySelector('.restriction-overlay').style.display = 'none';
        }
    } catch (error) {
        console.error('IP adresi kontrolü başarısız oldu.', error);
        document.querySelector('.restriction-overlay').style.display = 'flex';
    }
}
checkCountry();

// Anime Verileri - Google Drive bağlantıları ve bölüm bilgileri eklendi
const animeData = [
    { 
        id: 'anime1', 
        title: 'Attack on Titan', 
        poster: 'https://i.ibb.co/C0hYjM8/attack-on-titan.jpg', 
        imdb: 9.1, 
        year: 2013, 
        genres: ['Aksiyon', 'Fantastik'], 
        synopsis: "Eren Jaeger, üvey kardeşi Mikasa Ackerman ve arkadaşı Armin Arlert'in yaşamı, dev bir Titan'ın duvarı yıkmasıyla değişir...",
        episodes: [
            { ep: 1, videoId: '12G3w0b-tJ8uP1D8U3w0bA9-xG3w0b' }, // Örnek Google Drive ID
            { ep: 2, videoId: '1Hj8G3w0b4u3tB9gHj8G3w0bK2nL8P1D' },
            { ep: 3, videoId: null }, // Yayınlanmamış bölüm
            { ep: 4, videoId: '1L2nL8P1D1hHj8G3w0bK2nL8P1D' },
            { ep: 5, videoId: null },
            { ep: 6, videoId: '1B9gHj8G3w0bK2nL8P1D1hHj8' },
            { ep: 7, videoId: '1D8G3w0b-tJ8uP1D8U3w0bA9-xG3w0' },
            { ep: 8, videoId: '1D8G3w0b-tJ8uP1D8U3w0bA9-xG3w0' }
        ]
    },
    { 
        id: 'anime2', 
        title: 'Jujutsu Kaisen', 
        poster: 'https://i.ibb.co/v4t0f4B/jujutsu-kaisen.jpg', 
        imdb: 8.7, 
        year: 2020, 
        genres: ['Aksiyon', 'Doğaüstü'], 
        synopsis: "Lise öğrencisi Yuji Itadori, lanetli bir objeyi yuttuktan sonra büyücü olur...",
        episodes: [
            { ep: 1, videoId: '1L7uP1D8U3w0bA9-xG3w0b-tJ8' },
            { ep: 2, videoId: '1Hj8G3w0b4u3tB9gHj8G3w0bK2nL8P1D' }
        ]
    }
    // ...daha fazla anime ekleyebilirsin
];

document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const loginBtnHeader = document.getElementById('login-btn-header');
    const signupBtn = document.getElementById('signup-btn');
    const userButtons = document.querySelector('.user-buttons');
    const userProfile = document.querySelector('.user-profile');
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('logout-btn');
    const logo = document.querySelector('.logo');
    const loginToComment = document.getElementById('login-to-comment');

    const sections = document.querySelectorAll('.page-section');
    const newEpisodesList = document.getElementById('new-episodes-list');
    const featuredAnimesList = document.getElementById('featured-animes-list');
    const popularEpisodesList = document.getElementById('popular-episodes-list');
    const animeArchiveList = document.getElementById('anime-archive-list');
    const animeDetailSection = document.getElementById('anime-detail-section');
    const animeVideoPlayer = document.getElementById('anime-video-player');
    const episodesContainer = document.getElementById('episodes-container');
    const commentsList = document.getElementById('comments-list');
    const commentFormContainer = document.getElementById('comment-form-container');

    let videoPlayer;

    // Modalları açma ve kapama
    const showModal = (form) => {
        authModal.style.display = 'flex';
        loginForm.style.display = form === 'login' ? 'block' : 'none';
        registerForm.style.display = form === 'register' ? 'block' : 'none';
    };
    loginBtnHeader.addEventListener('click', () => showModal('login'));
    signupBtn.addEventListener('click', () => showModal('register'));
    document.querySelector('.close-btn').addEventListener('click', () => {
        authModal.style.display = 'none';
    });
    document.getElementById('show-register').addEventListener('click', (e) => { e.preventDefault(); showModal('register'); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showModal('login'); });
    if (loginToComment) {
        loginToComment.addEventListener('click', (e) => { e.preventDefault(); showModal('login'); });
    }

    // Firebase Giriş ve Kayıt Fonksiyonları
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMessage = document.getElementById('login-error-message');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            authModal.style.display = 'none';
            errorMessage.textContent = '';
        } catch (error) {
            errorMessage.textContent = 'Giriş Başarısız: ' + error.message;
        }
    });

    document.getElementById('register-btn').addEventListener('click', async () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorMessage = document.getElementById('register-error-message');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            authModal.style.display = 'none';
            errorMessage.textContent = '';
        } catch (error) {
            errorMessage.textContent = 'Kayıt Başarısız: ' + error.message;
        }
    });

    // Oturum Yönetimi ve UI Güncellemesi
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userButtons.style.display = 'none';
            userProfile.classList.remove('hidden');
            userDisplayName.textContent = user.email;
            // Giriş yapmış kullanıcılar için yorum formunu göster
            commentFormContainer.innerHTML = `
                <textarea id="comment-text" placeholder="Yorumunuzu buraya yazın..."></textarea>
                <button id="submit-comment">Yorum Yap</button>
                <p id="comment-error-message" class="error-message"></p>
            `;
            // Yorum gönderme listener'ı
            document.getElementById('submit-comment').addEventListener('click', async () => {
                const commentText = document.getElementById('comment-text').value;
                const urlParams = new URLSearchParams(window.location.search);
                const animeId = urlParams.get('anime');

                if (commentText.trim() === '') {
                    alert('Yorum boş olamaz.');
                    return;
                }

                if (user && animeId) {
                    await addComment(animeId, commentText, user.uid, user.email);
                    document.getElementById('comment-text').value = '';
                }
            });
        } else {
            userButtons.style.display = 'flex';
            userProfile.classList.add('hidden');
            // Giriş yapmamış kullanıcılar için yorum formunu gizle
            commentFormContainer.innerHTML = `<p>Yorum yapabilmek için <a href="#" id="login-to-comment">giriş yapmanız</a> gerekmektedir.</p>`;
            document.getElementById('login-to-comment').addEventListener('click', (e) => {
                e.preventDefault();
                showModal('login');
            });
        }
    });

    // Çıkış Yapma Fonksiyonu
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            alert('Başarıyla çıkış yapıldı!');
        } catch (error) {
            console.error('Çıkış yapma hatası:', error);
        }
    });

    // Ana sayfaya dönme
    logo.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '#home';
        renderPage('home');
    });

    // Sayfa Gezintisi (Single-page application mantığı)
    const renderPage = (pageName, params = {}) => {
        sections.forEach(section => {
            section.style.display = 'none';
        });

        if (pageName === 'home') {
            document.getElementById('home-section').style.display = 'block';
        } else if (pageName === 'archive') {
            document.getElementById('archive-section').style.display = 'block';
        } else if (pageName === 'anime-detail') {
            document.getElementById('anime-detail-section').style.display = 'block';
            loadAnimeDetails(params.animeId);
        }
    };

    // Navigasyon linkleri
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            if (targetId === 'home' || targetId === 'archive') {
                renderPage(targetId);
            } else {
                alert('Bu sayfa henüz yapılmadı!');
            }
        });
    });

    // Yorum Sistemi Fonksiyonları (Firebase Firestore)
    async function loadComments(animeId) {
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("animeId", "==", animeId), orderBy("timestamp", "asc"));
        
        onSnapshot(q, (snapshot) => {
            commentsList.innerHTML = ''; // Yorum listesini temizle
            snapshot.forEach((doc) => {
                const comment = doc.data();
                const commentEl = document.createElement('div');
                commentEl.classList.add('comment');
                commentEl.innerHTML = `
                    <p><strong>${comment.userName || 'Anonim'}</strong>: ${comment.text}</p>
                    <small>Yazan: ${comment.userEmail} | ${new Date(comment.timestamp.toDate()).toLocaleString()}</small>
                `;
                commentsList.appendChild(commentEl);
            });
        });
    }

    async function addComment(animeId, text, userId, userEmail) {
        const commentsRef = collection(db, "comments");
        try {
            await addDoc(commentsRef, {
                animeId: animeId,
                text: text,
                userId: userId,
                userEmail: userEmail,
                timestamp: new Date()
            });
            alert('Yorumunuz başarıyla gönderildi!');
        } catch (e) {
            console.error("Yorum ekleme hatası: ", e);
        }
    }

    // Anime listesini ekrana basan fonksiyon
    const renderAnimeCards = (listElement, data) => {
        listElement.innerHTML = '';
        data.forEach(anime => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <img src="${anime.poster}" alt="${anime.title}">
                <div class="card-info">
                    <h4>${anime.title}</h4>
                    <p>IMDB: ${anime.imdb}</p>
                </div>
            `;
            card.addEventListener('click', () => {
                window.history.pushState({}, '', `?anime=${anime.id}`);
                renderPage('anime-detail', { animeId: anime.id });
            });
            listElement.appendChild(card);
        });
    };

    // Anime arşivini ekrana basan fonksiyon
    const renderArchive = (data) => {
        animeArchiveList.innerHTML = '';
        data.forEach(anime => {
            const card = document.createElement('div');
            card.classList.add('anime-archive-card');
            card.innerHTML = `
                <img src="${anime.poster}" alt="${anime.title}">
                <div class="anime-archive-info">
                    <h4>${anime.title} <span class="imdb-score">${anime.imdb}</span></h4>
                    <p>Yapım Yılı: ${anime.year}</p>
                    <p>${anime.synopsis.substring(0, 100)}...</p>
                    <div class="tags">
                        ${anime.genres.map(tag => `<span>${tag}</span>`).join('')}
                    </div>
                </div>
            `;
            card.addEventListener('click', () => {
                window.history.pushState({}, '', `?anime=${anime.id}`);
                renderPage('anime-detail', { animeId: anime.id });
            });
            animeArchiveList.appendChild(card);
        });
    };

    // Filtreleme fonksiyonu
    const applyFilters = () => {
        const imdbFilter = parseFloat(document.getElementById('imdb-filter').value);
        const yearFilter = parseInt(document.getElementById('year-filter').value);
        const nameFilter = document.getElementById('name-filter').value.toLowerCase();
        const categoryCheckboxes = document.querySelectorAll('#category-filter input[type="checkbox"]:checked');
        const selectedCategories = Array.from(categoryCheckboxes).map(cb => cb.value);

        const filteredData = animeData.filter(anime => {
            const matchesImdb = isNaN(imdbFilter) || anime.imdb >= imdbFilter;
            const matchesYear = isNaN(yearFilter) || anime.year === yearFilter;
            const matchesName = anime.title.toLowerCase().includes(nameFilter);
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.some(cat => anime.genres.includes(cat));
            return matchesImdb && matchesYear && matchesName && matchesCategory;
        });

        renderArchive(filteredData);
    };

    document.getElementById('imdb-filter').addEventListener('change', applyFilters);
    document.getElementById('year-filter').addEventListener('input', applyFilters);
    document.getElementById('name-filter').addEventListener('input', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);

    // Anime detay sayfasını yükleyen fonksiyon
    const loadAnimeDetails = (animeId) => {
        const anime = animeData.find(a => a.id === animeId);
        if (!anime) {
            alert('Anime bulunamadı!');
            renderPage('home');
            return;
        }

        document.getElementById('anime-title-main').textContent = `${anime.title} Sezon 1 Bölüm 1`; // Başlangıç bölümü
        document.getElementById('anime-synopsis').textContent = anime.synopsis;
        document.getElementById('episode-list-title').textContent = `${anime.title} Bölümleri`;
        
        renderEpisodeList(anime);
        loadComments(animeId);
        
        // Varsayılan olarak ilk bölümü oynat
        playEpisode(anime.episodes[0]);
    };

    // Bölüm listesini oluşturan fonksiyon
    const renderEpisodeList = (anime) => {
        episodesContainer.innerHTML = '';
        anime.episodes.forEach(ep => {
            const episodeItem = document.createElement('div');
            episodeItem.classList.add('episode-item');
            if (!ep.videoId) {
                episodeItem.classList.add('unavailable');
            }
            episodeItem.innerHTML = `
                <span class="episode-number">${ep.ep}</span>
                <span>${anime.title} Sezon 1 Bölüm ${ep.ep}</span>
            `;
            episodeItem.addEventListener('click', () => {
                if (ep.videoId) {
                    playEpisode(ep);
                } else {
                    alert('Bu bölüm henüz yayınlanmadı!');
                }
            });
            episodesContainer.appendChild(episodeItem);
        });
    };

    // Video oynatıcıyı güncelleyen fonksiyon
    const playEpisode = (episode) => {
        const videoElement = document.getElementById('anime-video-player');
        if (videoPlayer) {
            videoPlayer.dispose();
        }

        if (episode.videoId) {
            // Google Drive doğrudan indirme URL'si
            const videoUrl = `https://drive.google.com/uc?export=download&id=${episode.videoId}`;
            videoElement.style.display = 'block';
            videoElement.innerHTML = `<source src="${videoUrl}" type="video/mp4" />`;
            videoPlayer = videojs('anime-video-player', {
                fluid: true,
                autoplay: true,
                muted: true
            });
        } else {
            videoElement.style.display = 'none';
            videoElement.innerHTML = `<div class="unavailable-video-placeholder">Bu bölüm henüz yayınlanmadı.</div>`;
        }
        
        document.getElementById('anime-title-main').textContent = `${animeData.find(a => a.id === 'anime1').title} Sezon 1 Bölüm ${episode.ep}`;
    };

    // Sayfa yüklendiğinde URL'yi kontrol et
    const initialLoad = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const animeId = urlParams.get('anime');
        if (animeId) {
            renderPage('anime-detail', { animeId });
        } else {
            renderPage('home');
            renderAnimeCards(newEpisodesList, animeData.slice(0, 8));
            renderAnimeCards(featuredAnimesList, animeData.slice(0, 5));
            renderAnimeCards(popularEpisodesList, animeData.slice(5, 10));
            renderArchive(animeData);
        }
    };
    initialLoad();

    // URL değiştiğinde sayfayı yeniden yükle
    window.addEventListener('popstate', initialLoad);
});
