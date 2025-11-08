import Image from "next/image";

const paperImages = [
  "1cab2f46-8e0f-4ef6-bc5e-9ac297f485da.png-02.png",
  "1d93934c-9bcd-4c7b-8955-5ae93567dfe4.png-02.png",
  "5a93d29f-dd31-44a4-a455-bc93c28d4393.png-02.png",
  "9be8c6cd-fd80-4f2b-a86a-54edbd59e5eb.png-03.png",
  "9f4fd85d-76cd-47dd-b099-487c6c50e066.png-02.png",
  "15e65654-21e4-4b5f-88ff-11354c92eed8.png-03.png",
  "17f0e55e-4097-4ef2-8bca-dc7b1eaec8f6.png-01.png",
  "37e399ef-5d34-4766-b32e-71fcd1103fe2.png-02.png",
  "94fd6459-e3c1-40c1-9176-0888f2cf8036.png-02.png",
  "534bd674-ca83-4d78-904e-32daa169e99b.png-02.png",
  "979b45f9-e071-40d2-ba46-48d8d541eb83.png-02.png",
  "6175c0f9-965a-4725-bf96-55245465b94a.png-02.png",
  "7493c04f-0208-403d-bb00-a94acaf1fb9c.png-02.png",
  "15867ea7-6320-460a-ae4a-d39598147477.png-02.png",
  "ae792434-2ae2-410f-bc74-056b964fa427.png-02.png",
  "b3ca1115-61cc-461b-97e1-a4a918d434be.png-03.png",
  "c4864f35-7c8b-40d3-9bb3-5263a0bbcf3d.png-02.png",
  "c7879767-31b4-4f18-8d92-14d7729d0e4b.png-01.png",
  "d58bfd9c-a86c-4edc-b429-b5716dea7089.png-02.png",
  "d86b958c-55cb-4e99-81d3-eebbaf7d3747.png-01.png",
  "e7ff34a1-71e2-42dd-a727-b01f56e3fc2e.png-2.png",
  "f945f1a5-2055-419e-896d-03af20d125e6.png-02.png",
];

export function AnimatedPaperBackground() {
  return (
    <>
      {/* Left flowing papers - 2 columns */}
      <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-3xl gap-2 overflow-hidden pl-12">
        {/* Left column 1 - align right */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="animate-flow-down flex flex-col items-end">
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 13) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 13) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Left column 2 - align left */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <div className="animate-flow-down-delayed flex flex-col items-start">
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 17) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 17) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right flowing papers - 2 columns */}
      <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-3xl gap-2 overflow-hidden pr-12">
        {/* Right column 1 - align right */}
        <div className="flex-1 overflow-hidden relative flex flex-col items-end">
          <div className="animate-flow-down-delayed-more flex flex-col items-end">
            <div className="space-y-2 pb-2 flex flex-col items-end">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 19) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 19) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Right column 2 - align left */}
        <div className="flex-1 overflow-hidden relative flex flex-col items-start">
          <div className="animate-flow-down-delayed-most flex flex-col items-start">
            <div className="space-y-2 pb-2 flex flex-col items-start">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 23) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 pb-2">
              {[...Array(20)].map((_, i) => {
                const height = 420 + ((i * 23) % 60);
                const width = height / 1.414;
                return (
                  <div
                    key={i}
                    className="bg-white border border-off-white/20 rounded-lg overflow-hidden relative"
                    style={{
                      height: `${height}px`,
                      width: `${width}px`,
                    }}
                  >
                    <Image
                      src={`/papers/${paperImages[i % paperImages.length]}`}
                      alt="Academic paper"
                      fill
                      className="object-contain"
                      sizes={`${width}px`}
                      quality={100}
                      unoptimized
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
