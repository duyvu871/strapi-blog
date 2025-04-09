document.addEventListener('DOMContentLoaded', function () {
    const swiperElement = document.querySelector('.series-swiper');
    if (swiperElement) {
        var swiper = new Swiper(".series-swiper", {
            effect: "stack",
            centeredSlides: true,
            slidesPerView: "auto",
            initialSlide: 1,
            lazyLoading: true,
            coverflowEffect: {
                rotate: 0, // 0: không xoay, 50: xoay 50 độ
                stretch: 90, // 0: không dãn ra, 1: dãn ra
                depth: 100, // 0: không dãn ra, 100: dãn ra
                modifier: 2.5, // 1: không dãn ra, 2: dãn ra
                slideShadows: false
            },
            duration: 1000,
            on: {
                click(event) {
                    console.log(this.clickedIndex);
                    
                    swiper.slideTo(this.clickedIndex)
                },
                mouseenter(event) {
                    console.log(this.hoveredIndex);
                    swiper.slideTo(this.hoveredIndex)
                },
            }
        });

        $('.series-swiper .swiper-slide').each(function (i, slide) {
            slide.addEventListener('mouseenter', function () { 
                swiper.slideTo(i);
            });
        });
    }
});