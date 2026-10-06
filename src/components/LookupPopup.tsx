import { useState } from "react";
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
        bg-[#172033]/40
        px-4
        py-6
        backdrop-blur-[2px]
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
          max-w-[620px]
          overflow-hidden
          rounded-2xl
          border
          border-[#E2E6EE]
          bg-white
          shadow-[0_20px_50px_rgba(23,32,51,0.16)]
        "
      >
        {/* Header */}
        <div
          className="
            flex
            min-h-[64px]
            items-center
            justify-between
            border-b
            border-[#E2E6EE]
            bg-white
            px-6
            py-4
          "
        >
          <div>
            <h2
              className="
                text-[18px]
                font-semibold
                leading-6
                text-[#172033]
              "
            >
              Lookup Type Management
            </h2>

            <p className="mt-1 text-xs text-[#667085]">Create a new lookup type</p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-xl
              leading-none
              text-[#667085]
              transition
              hover:bg-[#F7F9FC]
              hover:text-[#172033]
              focus:outline-none
              focus:ring-2
              focus:ring-[#213B7A]/20
            "
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6 sm:px-7">
            {/* Lookup Code */}
            <div className="space-y-2">
              <label
                htmlFor="popupLookupCode"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
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
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-[#F7F9FC]
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  placeholder:text-[#98A2B3]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              />
            </div>

            {/* Lookup Name */}
            <div className="space-y-2">
              <label
                htmlFor="popupLookupName"
                className="
                  block
                  text-[13px]
                  font-medium
                  text-[#667085]
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
                className="
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-[#E2E6EE]
                  bg-white
                  px-3
                  text-sm
                  text-[#172033]
                  outline-none
                  transition
                  placeholder:text-[#98A2B3]
                  hover:border-[#C8CED9]
                  focus:border-[#213B7A]
                  focus:ring-2
                  focus:ring-[#213B7A]/10
                "
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-[#E2E6EE]
              bg-[#F7F9FC]
              px-6
              py-4
              sm:px-7
            "
          >
            <button
              type="button"
              onClick={handleCancel}
              className="
                inline-flex
                h-10
                min-w-[92px]
                items-center
                justify-center
                rounded-lg
                border
                border-[#E2E6EE]
                bg-white
                px-4
                text-sm
                font-medium
                text-[#667085]
                transition
                hover:bg-[#F7F9FC]
                hover:text-[#172033]
                focus:outline-none
                focus:ring-2
                focus:ring-[#213B7A]/20
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                inline-flex
                h-10
                min-w-[92px]
                items-center
                justify-center
                rounded-lg
                bg-[#213B7A]
                px-4
                text-sm
                font-medium
                text-white
                shadow-sm
                transition
                hover:bg-[#1B3269]
                focus:outline-none
                focus:ring-2
                focus:ring-[#213B7A]/20
              "
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
