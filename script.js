const images = [
    "E3D10CC3-70C1-42CA-9DEE-E54A01ADC57E_1_105_c.webp",
    "53566BF3-F022-4AB7-8145-DAEDABFE86CA_1_105_c.webp",
    "DDED3DF4-A59E-41E1-8027-74647B3100DC_1_105_c.webp",
    "DSC_0765.webp",
    "DSC_0077.webp",
    "3E5EACDB-97F6-4807-9BE8-966FB8A0EDB1_1_105_c.webp",
    "66448C52-C08B-4618-9260-1D12B59A7E5F_1_105_c.webp",
    "2EEAF71D-A3DE-4A90-A4E5-999E6AF15C04_1_105_c.webp",
    "F1C80A84-E557-42D3-B7D0-838814E91A6B_1_105_c.webp",
    "DSC_0274.webp",
    "27BCEAA2-F025-4A58-B154-832A0116FECF_1_105_c.webp",
    "8EE1DD72-CA13-4351-8AE4-B2434189C6F0_1_102_o.webp",
    "DSC_0878.webp",
    "589F423D-1651-4FC7-9BF7-3E22134705F8_1_105_c.webp",
    "2982A0D4-669A-424E-8B8E-1D7E5CB8C56A_1_105_c.webp",
    "E411EEEA-A70C-48B7-AB7A-BEB9585F6BC0_1_105_c.webp",
]

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


