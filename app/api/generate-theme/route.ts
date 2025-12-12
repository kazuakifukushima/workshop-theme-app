
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Force dynamic to allow new requests at runtime
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    // Initialize OpenAI client inside handler to avoid build-time errors if text is missing
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const { role, interest, difficulty } = await req.json();

        if (!role || !interest || !difficulty) {
            return NextResponse.json(
                { error: "Missing required fields: role, interest, difficulty" },
                { status: 400 }
            );
        }

        const systemPrompt = `
あなたは医療AIワークショップのファシリテーターです。
参加者の属性（職種、興味分野、難易度）に基づいて、1つの共通したテーマで段階的に思考を深められるようなワークショップを提案してください。

出力は必ず以下のJSON形式で行ってください。
{
    "theme": "魅力的なワークショップのテーマタイトル",
    "steps": [
        {
            "title": "ステップのタイトル",
            "content": "このステップで行うことの簡単な説明",
            "prompt": "ChatGPTに入力するための具体的なプロンプト例"
        }
    ]
}

steps配列は必ず以下の4段階の構成にしてください：
1. **情報収集**: テーマに関する基礎知識や最新知見をChatGPTから引き出す段階。
2. **文章作成**: 得られた情報を基に、患者説明文、サマリー、メール下書きなどを作成する段階。
3. **データ・文献分析**: さらに深く掘り下げ、関連データの分析やガイドライン・論文との照らし合わせなどで思考を深める段階。
4. **資料作成**: 最終的なアウトプットとして、スライド構成案や配布資料を作成する段階。

各ステップは前のステップの出力を活用するなど、一連の流れとしてつながりを持たせてください。
プロンプトは、そのままコピーしてChatGPTに使える形式（「＃命令書...」など）で記述してください。
日本語で出力してください。
`;

        const userPrompt = `
以下の参加者に向けたワークショップテーマを生成してください。
- 職種: ${role}
- 興味・関心: ${interest}
- 難易度: ${difficulty}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content received from OpenAI");
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse JSON", content);
            return NextResponse.json(
                { error: "Failed to parse AI response" },
                { status: 500 }
            );
        }

        return NextResponse.json(parsedContent);
    } catch (error: any) {
        console.error("Error in generate-theme:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
