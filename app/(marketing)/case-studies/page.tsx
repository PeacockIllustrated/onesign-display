import { MarketingHero } from "@/components/marketing/MarketingHero";
import { SectionWrapper } from "@/components/marketing/SectionWrapper";
import { CaseStudyTile } from "@/components/marketing/CaseStudyTile";

export default function CaseStudiesPage() {
    return (
        <>
            <MarketingHero
                headline="Proven at Scale"
                subhead="See how leading brands use Onesign Display to protect their image and streamline operations."
            />

            <SectionWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CaseStudyTile
                        client="Burger & Co."
                        metric="-4hrs"
                        description="Weekly time saved on menu updates across 12 locations."
                        href="#"
                    />
                    <CaseStudyTile
                        client="The Coffee House"
                        metric="100%"
                        description="Brand consistency compliance achieved in month one."
                        href="#"
                    />
                    <CaseStudyTile
                        client="Fresh Eats"
                        metric="15min"
                        description="Time to deploy emergency price changes to 50 screens."
                        href="#"
                    />
                    <CaseStudyTile
                        client="Urban Pizza"
                        metric="0"
                        description="Design incidents reported since switching to Onesign."
                        href="#"
                    />
                </div>
            </SectionWrapper>
        </>
    );
}
