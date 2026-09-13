document.fonts.ready.then(() => {
    document.querySelector("body").style.opacity = 1;
});

document.addEventListener("DOMContentLoaded", function () {
    const generateBorder = (pointsPerSide = 10, roughness = 8) => {
        const pts = [];
        const jitter = () => (Math.random() - 0.5) * roughness;

        for (let i = 0; i <= pointsPerSide; i++) {
            pts.push(
                `${(i / pointsPerSide * 100).toFixed(1)}% ${Math.max(0, jitter()).toFixed(1)
                }%`,
            );
        }
        for (let i = 1; i <= pointsPerSide; i++) {
            pts.push(
                `${(100 - Math.max(0, jitter())).toFixed(1)}% ${(i / pointsPerSide * 100).toFixed(1)
                }%`,
            );
        }
        for (let i = pointsPerSide - 1; i >= 0; i--) {
            pts.push(
                `${(i / pointsPerSide * 100).toFixed(1)}% ${(100 - Math.max(0, jitter())).toFixed(1)
                }%`,
            );
        }
        for (let i = pointsPerSide - 1; i >= 1; i--) {
            pts.push(
                `${Math.max(0, jitter()).toFixed(1)}% ${(i / pointsPerSide * 100).toFixed(1)
                }%`,
            );
        }

        return `polygon(${pts.join(", ")})`;
    };

    const galery = document.querySelector(".bilder-galerie .bilder-container");
    if (galery) {
        const yearElement = document.querySelector(".bilder-galerie .jahr");
        const nextImage = () => {
            const oldElements = Array.from(galery.querySelectorAll("img"));

            const nextElement = document.createElement("img");
            fetch('/api/reel-image')
                .then(res => res.json())
                .then(data => {
                    nextElement.src = `data:image/png;base64,${data.image}`;
                    nextElement.style.opacity = 0;

                    if (nextElement.naturalWidth > nextElement.naturalHeight) {
                        nextElement.style.width = "100%";
                    } else {
                        nextElement.style.height = "100%";
                    }

                    nextElement.style.opacity = 1;
                    galery.style.clipPath = generateBorder(7, 6);
                    oldElements.forEach(el => { el.style.opacity = 0; });

                    setTimeout(() => {
                        oldElements.forEach(el => {
                            if (el.parentNode === galery) galery.removeChild(el);
                        });
                    }, 2000);
                    yearElement.innerText = data.year;
                });
            galery.appendChild(nextElement);
        };

        nextImage();
        setInterval(nextImage, 10_000);
    }

    const teamMemberPictures = document.querySelectorAll(".members-list .bilder-container");
    if (teamMemberPictures) {
        const assignBorders = () => {
            for (const image of teamMemberPictures) {
                image.style.clipPath = generateBorder(5, 4);
            }
        }
        assignBorders();
        setInterval(assignBorders, 6000);
    }

    globalThis.addEventListener("scroll", () => {
        const scrollTop = globalThis.scrollY;
        const docHeight = document.documentElement.scrollHeight -
            globalThis.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        document.querySelector(".fortschritt").style.width = scrollPercent +
            "%";
    });

    const news = document.querySelectorAll(".beitrag");
    news.forEach((beitrag) => {
        const images = beitrag.querySelectorAll(".container");
        images.forEach((img) => {
            img.style.clipPath = generateBorder(5, 4);
        });
    });

    const updateCountdown = () => {
        const currentTime = new Date();
        const timeLeft = whenItBegins - currentTime;

        const seconds = Math.floor(timeLeft / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const h = hours % 24;
        const m = minutes % 60;
        const s = seconds % 60;

        const parts = [];
        if (days > 0) parts.push(`${days} Tag${days !== 1 ? "e" : ""}`);
        if (h > 0) parts.push(`${h} Stunde${h !== 1 ? "n" : ""}`);
        if (m > 0) parts.push(`${m} Minute${m !== 1 ? "n" : ""}`);
        if (s > 0) parts.push(`${s} Sekunde${s !== 1 ? "n" : ""}`);

        const time = parts.join(" ") || "Weniger als eine Sekunde";
        countdown.innerText =
            `Nur noch\n${time},\ndann geht's los!\nAnmeldeschluss: ${registrationDeadline}`;
    };

    const whenItBegins = new Date("2027-07-05T13:00:00");
    const registrationDeadline = "21.06.2027";

    const countdown = document.querySelector(".countdown");
    if (countdown) {
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
});
