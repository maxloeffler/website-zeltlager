const images = [
    "DSC_0077.JPG",
    "DSC_0274.JPG",
    "DSC_0765.JPG",
    "DSC_0878.JPG",
    "DSC_0958.JPG",
    "DSC_0988.JPG",
];

document.addEventListener('DOMContentLoaded', function () {
    const generateBorder = (pointsPerSide = 10, roughness = 8) => {
        const pts = [];
        const jitter = () => (Math.random() - 0.5) * roughness;

        for (let i = 0; i <= pointsPerSide; i++) {
            pts.push(`${(i / pointsPerSide * 100).toFixed(1)}% ${Math.max(0, jitter()).toFixed(1)}%`);
        }
        for (let i = 1; i <= pointsPerSide; i++) {
            pts.push(`${(100 - Math.max(0, jitter())).toFixed(1)}% ${(i / pointsPerSide * 100).toFixed(1)}%`);
        }
        for (let i = pointsPerSide - 1; i >= 0; i--) {
            pts.push(`${(i / pointsPerSide * 100).toFixed(1)}% ${(100 - Math.max(0, jitter())).toFixed(1)}%`);
        }
        for (let i = pointsPerSide - 1; i >= 1; i--) {
            pts.push(`${Math.max(0, jitter()).toFixed(1)}% ${(i / pointsPerSide * 100).toFixed(1)}%`);
        }

        return `polygon(${pts.join(', ')})`;
    }

    const galery = document.querySelector('.bilder-container');
    if (galery) {
        let currentImage = Math.random() * images.length | 0;
        const nextImage = () => {
            currentImage = (currentImage + 1) % images.length;

            const currentElement = galery.querySelector('img');
            const nextElement = document.createElement('img');

            nextElement.src = "bilder/galerie/" + images[currentImage];
            nextElement.style.opacity = 0;
            if (nextElement.naturalWidth > nextElement.naturalHeight) {
                nextElement.style.width = "100%";
            } else {
                nextElement.style.height = "100%";
            }

            nextElement.style.opacity = 0;
            galery.appendChild(nextElement);
            galery.style.clipPath = generateBorder(7, 6);

            nextElement.onload = () => {
                nextElement.style.opacity = 1;
                currentElement.style.opacity = 0;

                setTimeout(() => {
                    galery.removeChild(currentElement);
                }, 2000);
            };
            document.querySelector('img').style.clipPath = generateBorder(7, 6);
        }

        nextImage();
        setInterval(nextImage, 6000);
    }

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        document.querySelector('.fortschritt').style.width = scrollPercent + '%';
    });

    const news = document.querySelectorAll('.beitrag');
    news.forEach(beitrag => {
        const images = beitrag.querySelectorAll('.container');
        console.log(images);
        images.forEach(img => {
            img.style.clipPath = generateBorder(5, 4);
        });
    });
});


