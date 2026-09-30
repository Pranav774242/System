import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
// import { LookupTypePopup } from "@/components/LookupTypePopup";

import { LookupTypePopup } from "@/components/LookupPopup";

import { initialLookupData, type LookupItem, type LookupTypeForm } from "@/lib/lookup-data";

export const Route = createFileRoute("/lookup-management")({
  head: () => ({
    meta: [
      {
        title: "Lookup Management — System Administrator Panel",
      },
    ],
  }),

  component: LookupManagementPage,
});

function LookupManagementPage() {
  const [lookupCode, setLookupCode] = useState("");
  const [lookupName, setLookupName] = useState("");

  const [lookupData, setLookupData] = useState<LookupItem[]>(initialLookupData);

  const [popupOpen, setPopupOpen] = useState(false);

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

    console.log("Main Lookup Data:", data);
  }

  function handleCancel() {
    setLookupCode("");
    setLookupName("");
  }

  function handlePopupSubmit(data: LookupTypeForm) {
    console.log("Popup Submitted:", data);

    /*
     * For now we are only printing the data.
     *
     * Later your API call can be placed here.
     */

    const newLookup: LookupItem = {
      id: lookupData.length + 1,
      lookupCode: data.lookupCode,
      lookupDescription: data.lookupName,
    };

    setLookupData((currentData) => [...currentData, newLookup]);

    setPopupOpen(false);
  }

  return (
    <AppShell title="Lookup Management" subtitle="Manage lookup types and lookup sub types">
      <div className="space-y-5">
        {/* ================================================= */}
        {/* LOS Header                                        */}
        {/* ================================================= */}

        {/* <div
          className="
            border-2
            border-[#548235]
            bg-white
          "
        >
          <div
            className="
              flex
              min-h-[65px]
              items-center
              justify-center
              px-4
            "
          >
            <h1
              className="
                text-center
                text-xl
                font-bold
                text-[#365927]
                sm:text-2xl
                lg:text-3xl
              "
            >
              Development of Loan Originating System (LOS)
            </h1>
          </div>
        </div> */}

        {/* ================================================= */}
        {/* Common Dashboard                                   */}
        {/* ================================================= */}

        {/* <div className="flex justify-center">
          <div
            className="
              border
              border-[#548235]
              bg-[#a9d18e]
              px-4
              py-1
              text-lg
              font-bold
              text-[#365927]
              sm:px-6
              sm:text-xl
            "
          >
            Common Dashboard
          </div>
        </div> */}

        {/* ================================================= */}
        {/* Main Outer Container                              */}
        {/* ================================================= */}

        <div
          className="
            relative
            border-2
            border-black
            bg-white
            p-4
            sm:p-6
            lg:p-8
          "
        >
          {/* ================================================= */}
          {/* Top Right Information                             */}
          {/* ================================================= */}

          <div
            className="
              mb-4
              flex
              flex-col
              items-start
              gap-1
              sm:items-end
            "
          >
            <div className="text-sm font-semibold">
              Date :<span className="ml-2 font-normal">{new Date().toLocaleDateString("en-IN")}</span>
            </div>

            <div className="text-sm font-semibold">
              User :<span className="ml-2 font-normal">System Administrator</span>
            </div>
          </div>

          {/* ================================================= */}
          {/* Lookup Sub Type Box                               */}
          {/* ================================================= */}

          <div
            className="
              relative
              mx-auto
              w-full
              max-w-[1050px]
              border
              border-black
              bg-white
              p-5
              sm:p-7
              lg:p-9
            "
          >
            {/* ============================================= */}
            {/* Top Title + Popup Button                      */}
            {/* ============================================= */}

            <div
              className="
                relative
                mb-8
                flex
                items-center
                justify-center
              "
            >
              <h2
                className="
                  text-center
                  text-lg
                  font-bold
                  underline
                  sm:text-xl
                "
              >
                Lookup Sub Type Management
              </h2>

              {/* TOP RIGHT BUTTON */}

              <button
                type="button"
                onClick={() => setPopupOpen(true)}
                className="
                  absolute
                  right-0
                  top-1/2
                  -translate-y-1/2
                  border
                  border-[#548235]
                  bg-[#a9d18e]
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-[#365927]
                  transition
                  hover:bg-[#8fbd76]
                  sm:px-4
                  sm:py-2
                  sm:text-sm
                "
              >
                Lookup Type
              </button>
            </div>

            {/* ============================================= */}
            {/* Search Fields                                 */}
            {/* ============================================= */}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div
                className="
                  grid
                  gap-2
                  sm:grid-cols-[110px_1fr_110px_1fr]
                  sm:items-center
                "
              >
                {/* Lookup Code */}

                <label
                  htmlFor="lookupCode"
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  Lookup Code
                </label>

                <input
                  id="lookupCode"
                  type="text"
                  value={lookupCode}
                  onChange={(event) => setLookupCode(event.target.value)}
                  className="
                    h-9
                    w-full
                    border
                    border-[#7ea7d8]
                    bg-[#f5f5f5]
                    px-2
                    text-sm
                    outline-none
                    focus:border-[#548235]
                    focus:ring-1
                    focus:ring-[#548235]
                  "
                />

                {/* Lookup Name */}

                <label
                  htmlFor="lookupName"
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                  "
                >
                  Lookup Name
                </label>

                <input
                  id="lookupName"
                  type="text"
                  value={lookupName}
                  onChange={(event) => setLookupName(event.target.value)}
                  className="
                    h-9
                    w-full
                    border
                    border-[#7ea7d8]
                    bg-[#f5f5f5]
                    px-2
                    text-sm
                    outline-none
                    focus:border-[#548235]
                    focus:ring-1
                    focus:ring-[#548235]
                  "
                />
              </div>

              {/* ============================================= */}
              {/* Table                                         */}
              {/* ============================================= */}

              <div className="mt-7 overflow-x-auto">
                <table
                  className="
                    w-full
                    min-w-[600px]
                    border-collapse
                    border
                    border-black
                    text-sm
                  "
                >
                  <thead>
                    <tr className="bg-white">
                      <th
                        className="
                          w-[70px]
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                          font-bold
                        "
                      >
                        Sr
                      </th>

                      <th
                        className="
                          w-[180px]
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                          font-bold
                        "
                      >
                        Lookup Code
                      </th>

                      <th
                        className="
                          border
                          border-black
                          px-3
                          py-2
                          text-center
                          font-bold
                        "
                      >
                        Lookup Description
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {lookupData.map((item, index) => (
                      <tr key={item.id}>
                        <td
                          className="
                            h-10
                            border
                            border-black
                            px-3
                            text-center
                          "
                        >
                          {index + 1}
                        </td>

                        <td
                          className="
                            border
                            border-black
                            px-3
                            font-medium
                          "
                        >
                          {item.lookupCode}
                        </td>

                        <td
                          className="
                            border
                            border-black
                            px-3
                          "
                        >
                          {item.lookupDescription}
                        </td>
                      </tr>
                    ))}

                    {/* Empty rows to preserve the old design */}

                    {lookupData.length < 6 &&
                      Array.from({
                        length: 6 - lookupData.length,
                      }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td
                            className="
                              h-10
                              border
                              border-black
                            "
                          />

                          <td
                            className="
                              border
                              border-black
                            "
                          />

                          <td
                            className="
                              border
                              border-black
                            "
                          />
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* ============================================= */}
              {/* Bottom Buttons                                 */}
              {/* ============================================= */}

              <div
                className="
                  flex
                  flex-wrap
                  justify-center
                  gap-4
                  pt-2
                "
              >
                <button
                  type="submit"
                  className="
                    min-w-[90px]
                    border
                    border-gray-700
                    bg-white
                    px-5
                    py-2
                    text-sm
                    font-semibold
                    text-gray-900
                    hover:bg-gray-100
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
                    border-gray-700
                    bg-white
                    px-5
                    py-2
                    text-sm
                    font-semibold
                    text-gray-900
                    hover:bg-gray-100
                  "
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* POPUP                                                 */}
      {/* ===================================================== */}

      <LookupTypePopup open={popupOpen} onClose={() => setPopupOpen(false)} onSubmit={handlePopupSubmit} />
    </AppShell>
  );
}
