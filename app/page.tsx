"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

// AIワークショップ用 テーマ生成コンポーネント
// 職種（自由記述）＋ 興味分野（自由記述）＋ 難易度 → AIがテーマを生成

type Difficulty = "初級" | "中級" | "上級";

type Step = {
  title: string;
  content: string;
  prompt?: string;
  rationale?: string; // API might return this, harmless if extra
};

type GenerateThemeResponse = {
  theme: string;
  steps: Step[];
};

function isGenerateThemeResponse(x: any): x is GenerateThemeResponse {
  return (
    x &&
    typeof x === "object" &&
    typeof x.theme === "string" &&
    Array.isArray(x.steps) &&
    x.steps.every(
      (s: any) =>
        s &&
        typeof s === "object" &&
        typeof s.title === "string" &&
        typeof s.content === "string" &&
        (s.prompt === undefined || typeof s.prompt === "string")
    )
  );
}

export default function Home() {
  const [roleText, setRoleText] = useState("");
  const [interestText, setInterestText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [theme, setTheme] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canGenerate = useMemo(
    () => !!roleText.trim() && !!interestText.trim() && !!difficulty && !loading,
    [roleText, interestText, difficulty, loading]
  );

  async function generateAITheme(role: string, interest: string, diff: Difficulty) {
    const res = await fetch("/api/generate-theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, interest, difficulty: diff }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "テーマ生成に失敗しました");
    }

    const data = await res.json();
    // Validate response structure
    if (!data || !data.theme || !Array.isArray(data.steps)) {
      throw new Error("APIレスポンス形式が不正です");
    }
    return data as GenerateThemeResponse;
  }

  const handleGenerate = async () => {
    if (!roleText.trim() || !interestText.trim() || !difficulty) return;

    try {
      setLoading(true);
      setErrorMsg(null);
      setTheme(null);
      setSteps(null);

      const result = await generateAITheme(
        roleText.trim(),
        interestText.trim(),
        difficulty as Difficulty
      );

      setTheme(result.theme);
      setSteps(result.steps);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? "テーマ生成中にエラーが発生しました。");
      setTheme(null);
      setSteps(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            AIワークショップ テーマ生成
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            あなたの専門分野と興味に合わせて、オリジナルのワークショップテーマを生成します。
          </p>
        </div>

        <Card className="p-6 shadow-xl bg-white/90 backdrop-blur">
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  職種 (Role)
                </label>
                <Input
                  placeholder="例：救急医、ICU看護師、薬剤師"
                  value={roleText}
                  onChange={(e) => setRoleText(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  興味・関心 (Interest)
                </label>
                <Input
                  placeholder="例：感染対策、業務効率化、データ分析"
                  value={interestText}
                  onChange={(e) => setInterestText(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                難易度 (Difficulty)
              </label>
              <Select onValueChange={(v) => setDifficulty(v as Difficulty)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="難易度を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {(["初級", "中級", "上級"] as const).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button size="lg" className="w-full font-bold text-lg" onClick={handleGenerate} disabled={!canGenerate}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                "テーマを生成する"
              )}
            </Button>

            {errorMsg && (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm font-medium">
                {errorMsg}
              </div>
            )}
          </CardContent>
        </Card>

        {theme && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Generated Theme</h2>
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">{theme}</h3>
            </div>

            {steps && (
              <div className="grid gap-6">
                {steps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden border-l-4 border-l-indigo-500">
                      <div className="bg-gray-50 px-6 py-3 border-b flex items-center justify-between">
                        <h4 className="font-bold text-gray-700">Step {idx + 1}: {step.title}</h4>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <p className="text-gray-600 leading-relaxed">{step.content}</p>
                        {step.prompt && (
                          <div className="bg-gray-900 rounded-lg p-4 relative group">
                            <pre className="text-gray-100 text-sm whitespace-pre-wrap font-mono relative z-0">
                              {step.prompt}
                            </pre>
                            <Button
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              size="sm"
                              variant="secondary"
                              onClick={async () => {
                                await navigator.clipboard.writeText(step.prompt!);
                                // Simple toast could be added here
                                const btn = document.activeElement as HTMLElement;
                                const originalText = btn.innerText;
                                btn.innerText = "Copied!";
                                setTimeout(() => btn.innerText = originalText, 2000);
                              }}
                            >
                              Copy Prompt
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
