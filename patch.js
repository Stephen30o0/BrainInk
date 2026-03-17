const fs = require('fs');
const content = fs.readFileSync('src/components/teacher/UploadAnalyze.tsx', 'utf8');

// Find the end of the selectedAssignment block
const step3endStr = \
      {selectedAssignment && (
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 text-[#10b981]">
          <CheckCircle className="h-6 w-6" />
        </div>
      )}
    </div>
  </div>
)}\;

const index = content.indexOf(step3endStr);

if (index === -1) {
    console.log("Could not find step3 end string.");
    process.exit(1);
}

const splitIndex = index + step3endStr.length;
const before = content.slice(0, splitIndex);

// Find where the UploadAnalyze component returns its main JSX div. Wait, I want to keep the closing tags for the main container.
// The main container ends with:
//         )}
//       </div>
//     </div>
//   );
// };
const endStr = \
      </div>
    </div>
  );
};
\;

const lastIndex = content.lastIndexOf(endStr);
if (lastIndex === -1) {
    console.log("Could not find endStr");
    process.exit(1);
}

const after = content.slice(lastIndex);

const newContent = \
        {/* Settings & Task Type */}
        {selectedAssignment && (
          <div
            ref={(el) => { uploadStepRefs.current.settings = el; }}
            className="rounded-2xl border border-[#e2e4e9] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className={\\\lex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm \\\\\\}>
                {completedSteps.settings ? <CheckCircle className="h-4 w-4" /> : '4'}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a94a6]">Step 4</p>
                <h3 className="text-xl font-bold text-[#111418]">Settings & Analysis Type</h3>
              </div>
            </div>

            <div className="grid gap-6 max-w-xl">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#8a94a6]">
                  Task Type
                </label>
                <div className="relative">
                    <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value as 'grading' | 'analysis')}
                    className="w-full appearance-none rounded-xl border-2 border-[#e2e4e9] bg-[#f8f9fa] px-4 py-4 pr-10 text-base font-medium text-[#111418] transition-colors focus:border-[#10b981] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#10b981]/10"
                    >
                    <option value="grading">Grade Assignment (Create Marks & Feedback)</option>
                    <option value="analysis">General Analysis (Understand Student Needs)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8a94a6]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-[#8a94a6]">
                  Model Type
                </label>
                <div className="relative">
                    <select
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value as 'gemini' | 'openai')}
                    className="w-full appearance-none rounded-xl border-2 border-[#e2e4e9] bg-[#f8f9fa] px-4 py-4 pr-10 text-base font-medium text-[#111418] transition-colors focus:border-[#10b981] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#10b981]/10"
                    >
                    <option value="gemini">Gemini 2.5 Flash</option>
                    <option value="openai">OpenAI GPT-4o</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#8a94a6]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>

              {assignmentType === 'analysis' && (
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-[#8a94a6]">
                    Analysis Topic
                  </label>
                  <input
                    type="text"
                    value={assignmentTitle}
                    onChange={(e) => setAssignmentTitle(e.target.value)}
                    placeholder="E.g., Fraction comprehension..."
                    className="w-full rounded-xl border-2 border-[#e2e4e9] bg-[#f8f9fa] px-4 py-4 text-base font-medium text-[#111418] transition-colors focus:border-[#10b981] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#10b981]/10 placeholder:text-[#8a94a6]"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Student Processing Section */}
        {selectedAssignment && (
          <div
            ref={(el) => { uploadStepRefs.current.students = el; }}
            className="rounded-2xl border border-[#e2e4e9] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className={\\\lex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm \\\\\\}>
                {completedSteps.students ? <CheckCircle className="h-4 w-4" /> : '5'}
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a94a6]">Step 5</p>
                <h3 className="text-xl font-bold text-[#111418]">Select Students for Analysis</h3>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="rounded-xl border border-[#e2e4e9] bg-[#f8f9fa] overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#e2e4e9] bg-white px-4 py-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(filteredStudents.map(student => student.id.toString()));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                        className="h-5 w-5 rounded border-[#ced4df] text-[#10b981] transition focus:ring-[#10b981]"
                      />
                    </div>
                    <span className="text-sm font-bold text-[#111418]">
                      {selectedStudents.length > 0 ? \\\\\\ Selected\\\ : 'Select All Students'}
                    </span>
                  </label>
                  <span className="text-xs font-medium text-[#8a94a6] bg-[#e2e4e9]/50 px-2 py-1 rounded-md">
                    {filteredStudents.length} Total
                  </span>
                </div>
                
                <div className="divide-y divide-[#e2e4e9] max-h-60 overflow-y-auto bg-white">
                  {filteredStudents.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[#8a94a6]">
                      No students found.
                    </div>
                  ) : (
                    filteredStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-[#f8f9fa] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id.toString() || student.id)}
                            onChange={() => {
                              const id = student.id.toString() || student.id;
                              setSelectedStudents(prev =>
                                prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
                              );
                            }}
                            className="h-5 w-5 rounded border-[#ced4df] text-[#10b981] transition focus:ring-[#10b981]"
                          />
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e2e4e9]/50 text-xs font-bold text-[#5f6574]">
                              {student.name ? student.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : \\\\\\\\\\\\}
                            </div>
                            <span className="text-sm font-medium text-[#111418]">
                              {student.name || \\\\\\ \\\\\\}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                <button
                  onClick={handleProcess}
                  disabled={selectedStudents.length === 0 || processingState.status !== 'idle'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111418] px-8 py-5 text-lg font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:bg-[#2c313a] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-4 focus:ring-black/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  {processingState.status !== 'idle' ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Processing ({processedCount}/{processingQueue.current.length})...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
                      <span>{assignmentType === 'grading' ? 'Grade with K.A.N.A' : 'Analyze with K.A.N.A'}</span>
                    </>
                  )}
                </button>
              </div>

              {processingState.status !== 'idle' && (
                <div className="mt-6">
                  <ProcessingStatus
                    status={processingState.status}
                    message={processingState.message}
                    progress={processingState.progress}
                    error={processingState.error}
                  />
                  {processedCount > 0 && processingQueue.current.length > 0 && (
                    <div className="mt-2 text-center text-sm font-medium text-[#5f6574]">
                      Processed {processedCount} of {processingQueue.current.length} students
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
\;

fs.writeFileSync('src/components/teacher/UploadAnalyze.tsx', before + newContent + after);
console.log('Patched file!');
