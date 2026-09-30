import { useState } from "react";
// import type { LookupTypeForm } from "@/lib/lookup-data";
import type { LookupTypeForm } from "@/lib/lookup-data";

type LookupTypePopupProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LookupTypeForm) => void;
};

export function LookupTypePopup({ open, onClose, onSubmit }: LookupTypePopupProps) {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupName, setLookupName] = useState("");

  if (!open) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = {
      lookupCode: lookupCode.trim(),
      lookupName: lookupName.trim(),
    };

    if (!data.lookupCode) {
      console.log("Lookup Code is required");
      return;
    }

    if (!data.lookupName) {
      console.log("Lookup Name is required");
      return;
    }

    console.log("Lookup Type Data:", data);

    onSubmit(data);

    setLookupCode("");
    setLookupName("");
  }

  function handleCancel() {
    setLookupCode("");
    setLookupName("");
    onClose();
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        px-4
        py-6
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="
          relative
          w-full
          max-w-[700px]
          border
          border-[#548235]
          bg-white
          shadow-2xl
        "
      >
        {/* Popup Header */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#548235]
            bg-[#548235]
            px-5
            py-3
          "
        >
          <h2
            className="
              text-base
              font-bold
              text-white
              sm:text-lg
            "
          >
            Lookup Type Management
          </h2>

          <button
            type="button"
            onClick={handleCancel}
            className="
              text-2xl
              leading-none
              text-white
              hover:opacity-70
            "
          >
            ×
          </button>
        </div>

        {/* Popup Content */}

        <form onSubmit={handleSubmit} className="px-5 py-7 sm:px-8 sm:py-9">
          <div className="space-y-6">
            {/* Lookup Code */}

            <div
              className="
                grid
                gap-2
                sm:grid-cols-[140px_1fr]
                sm:items-center
              "
            >
              <label
                htmlFor="popupLookupCode"
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                Lookup Code
              </label>

              <input
                id="popupLookupCode"
                type="text"
                value={lookupCode}
                onChange={(event) => setLookupCode(event.target.value)}
                placeholder="Enter lookup code"
                readOnly
                className="
                  h-10
                  w-full
                  max-w-[360px]
                  border
                  border-[#7ea7d8]
                  bg-[#f5f5f5]
                  px-3
                  text-sm
                  outline-none
                  focus:border-[#548235]
                  focus:ring-1
                  focus:ring-[#548235]
                "
              />
            </div>

            {/* Lookup Name */}

            <div
              className="
                grid
                gap-2
                sm:grid-cols-[140px_1fr]
                sm:items-center
              "
            >
              <label
                htmlFor="popupLookupName"
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                "
              >
                Lookup Name
              </label>
              <input
                id="popupLookupName"
                type="text"
                value={lookupName}
                onChange={(event) => setLookupName(event.target.value)}
                placeholder="Enter lookup name"
                className="h-10 w-full max-w-[500px] border border-[#7ea7d8] bg-[#f5f5f5] px-3 text-sm outline-none focus:border-[#548235] focus:ring-1 focus:ring-[#548235]"
              />
            </div>
          </div>

          {/* Buttons */}

          <div
            className="
              mt-9
              flex
              justify-center
              gap-3
            "
          >
            <button
              type="submit"
              className="
                min-w-[90px]
                border
                border-[#548235]
                bg-[#548235]
                px-5
                py-2
                text-sm
                font-semibold
                text-white
                hover:bg-[#426829]
              "
            >
              Submit
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="
                min-w-[90px]
                border
                border-gray-500
                bg-white
                px-5
                py-2
                text-sm
                font-semibold
                text-gray-800
                hover:bg-gray-100
              "
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
