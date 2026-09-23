import React from 'react';
import './AboutComponent.css';

const About = () => {
    return (
        <div className="about-section py-8 md:py-12 px-4">
            <div className='container mx-auto max-w-4xl'>
                <h2 className="about-title text-2xl md:text-3xl font-bold text-center mb-4 md:mb-6">
                    من نحن
                </h2>
                <div className="about-content flex flex-col gap-4">
                    <p className="about-paragraph text-sm md:text-base leading-relaxed text-justify">
                        هي شركة رائدة في تقديم استشارات هندسية متكاملة، حيث نركز على تقديم حلول تصميم هندسي مبتكرة وشاملة لتلبية احتياجات مشاريعكم. فريقنا من المهندسين المتخصصين يمتلك خبرة واسعة في تقديم استشارات دقيقة ومهنية في مختلف مجالات الهندسة، بما في ذلك الاعمال الكهربيه والتصميم المعماري، الهندسة المدنية، والميكانيكية. نحن ملتزمون بتوفير استشارات ذات جودة عالية لضمان نجاح مشاريعكم وتحقيق رؤيتكم بكفاءة واحترافية.
                    </p>
                    <p className="about-paragraph text-sm md:text-base leading-relaxed text-justify">
                        هي شركة رائدة في تقديم استشارات هندسية متكاملة، حيث نركز على تقديم حلول تصميم هندسي مبتكرة وشاملة لتلبية احتياجات مشاريعكم. فريقنا من المهندسين المتخصصين يمتلك خبرة واسعة في تقديم استشارات دقيقة ومهنية في مختلف مجالات الهندسة، بما في ذلك الاعمال الكهربيه والتصميم المعماري، الهندسة المدنية، والميكانيكية. نحن ملتزمون بتوفير استشارات ذات جودة عالية لضمان نجاح مشاريعكم وتحقيق رؤيتكم بكفاءة واحترافية.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default About;