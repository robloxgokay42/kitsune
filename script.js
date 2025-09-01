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
        }
    } catch (error) {
        console.error('IP adresi kontrolü başarısız oldu.', error);
        // Hata durumunda siteyi engellemek güvenli bir yaklaşımdır.
        document.querySelector('.restriction-overlay').style.display = 'flex';
    }
}
checkCountry();

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

    // Modalları açma ve kapama
    loginBtnHeader.addEventListener('click', () => {
        authModal.style.display = 'flex';
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    signupBtn.addEventListener('click', () => {
        authModal.style.display = 'flex';
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    document.querySelector('.close-btn').addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    // Formlar arası geçiş
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    // Firebase Giriş ve Kayıt Fonksiyonları
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorMessage = document.getElementById('login-error-message');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            authModal.style.display = 'none';
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
        } catch (error) {
            errorMessage.textContent = 'Kayıt Başarısız: ' + error.message;
        }
    });

    // Oturum Yönetimi ve UI Güncellemesi
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userButtons.style.display = 'none';
            userProfile.classList.remove('hidden');
            userDisplayName.textContent = user.email; // veya kullanıcı adı
        } else {
            userButtons.style.display = 'flex';
            userProfile.classList.add('hidden');
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

    // Sayfa Gezintisi (Single-page application mantığı)
    const navLinks = document.querySelectorAll('.main-nav a');
    const sections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            sections.forEach(section => {
                section.style.display = 'none';
            });
            if (targetId) {
                document.getElementById(`${targetId}-section`).style.display = 'block';
            }
        });
    });

    // Dummy Anime Verisi (Gerçek bir API veya daha kapsamlı bir JSON yapısı kullanılabilir)
    const animeData = [
        { id: 'anime1', title: 'Attack on Titan', poster: 'https://i.ibb.co/C0hYjM8/attack-on-titan.jpg', imdb: 9.1, year: 2013, genres: ['Aksiyon', 'Fantastik'], synopsis: "İnsanlık, devler tarafından yok edilmenin eşiğine gelmiştir..." },
        { id: 'anime2', title: 'Fullmetal Alchemist', poster: 'https://i.ibb.co/D8G3w0b/fullmetal-alchemist.jpg', imdb: 9.1, year: 2009, genres: ['Macera', 'Fantastik'], synopsis: "Edward ve Alphonse Elric kardeşler, annelerini diriltmek için simyayı kullanır..." },
        { id: 'anime3', title: 'Jujutsu Kaisen', poster: 'https://i.ibb.co/v4t0f4B/jujutsu-kaisen.jpg', imdb: 8.7, year: 2020, genres: ['Aksiyon', 'Doğaüstü'], synopsis: "Lise öğrencisi Yuji Itadori, lanetli bir objeyi yuttuktan sonra büyücü olur..." },
        // ...daha fazla anime ekleyebilirsin
    ];
    
    // Yorum Sistemi Fonksiyonları (Firebase Firestore)
    async function loadComments(animeId) {
        const commentsRef = collection(db, "comments");
        const q = query(commentsRef, where("animeId", "==", animeId), orderBy("timestamp"));
        
        onSnapshot(q, (snapshot) => {
            const commentsList = document.getElementById('comments-list');
            commentsList.innerHTML = ''; // Yorum listesini temizle
            snapshot.forEach((doc) => {
                const comment = doc.data();
                const commentEl = document.createElement('div');
                commentEl.classList.add('comment');
                commentEl.innerHTML = `
                    <p><strong>${comment.userName || 'Anonim'}</strong>: ${comment.text}</p>
                    <small>${new Date(comment.timestamp.toDate()).toLocaleString()}</small>
                `;
                commentsList.appendChild(commentEl);
            });
        });
    }

    // Yorum Ekleme Fonksiyonu
    async function addComment(animeId, text, userId) {
        const commentsRef = collection(db, "comments");
        try {
            await addDoc(commentsRef, {
                animeId: animeId,
                text: text,
                userId: userId,
                timestamp: new Date()
            });
        } catch (e) {
            console.error("Yorum ekleme hatası: ", e);
        }
    }

    // Anime listesini ekrana basan fonksiyon
    function renderAnimeCards(listId, data) {
        const listElement = document.getElementById(listId);
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
                // Burada anime detay sayfasına yönlendirme veya dinamik içerik yükleme yapılabilir.
                // Örneğin: window.location.href = `anime.html?id=${anime.id}`;
                alert(`${anime.title} sayfasına yönlendiriliyorsunuz.`);
            });
            listElement.appendChild(card);
        });
    }

    // Anime arşivini ekrana basan fonksiyon
    function renderArchive(data) {
        const listElement = document.getElementById('anime-archive-list');
        listElement.innerHTML = '';
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
            listElement.appendChild(card);
        });
    }

    // Sayfa yüklendiğinde içerikleri render et
    renderAnimeCards('new-episodes-list', animeData.slice(0, 8));
    renderAnimeCards('featured-animes-list', animeData.slice(0, 5));
    renderAnimeCards('popular-episodes-list', animeData.slice(5, 10));
    renderArchive(animeData);

    // Filtreleme fonksiyonu
    function applyFilters() {
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
    }

    document.getElementById('imdb-filter').addEventListener('change', applyFilters);
    document.getElementById('year-filter').addEventListener('input', applyFilters);
    document.getElementById('name-filter').addEventListener('input', applyFilters);
    document.getElementById('category-filter').addEventListener('change', applyFilters);

});
