export const CartProgressBar = ({activeIndex}: {activeIndex: number}) => {
    return (
  <div className="flex justify-between items-center mb-6 px-8 mt-[60px]">
    {["Cart", "Address", "Payment"].map((step, index) => (
      <div key={step} className="flex-1 flex items-center">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold 
            ${activeIndex === index ? "bg-blue-600" : 
              activeIndex > index ? "bg-green-500" : "bg-gray-300"}`}
        >
          {index + 1}
        </div>
        <div className="ml-2 text-sm font-semibold">
          {step}
        </div>
        {index < 2 && (
          <div
            className={`flex-1 h-1 mx-2 
              ${activeIndex > index ? "bg-green-500" : "bg-gray-300"}`}
          ></div>
        )}
      </div>
    ))}
  </div>
    )
} 