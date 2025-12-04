"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Wand2, RefreshCw, Copy, Check } from "lucide-react";
import { useSecureClipboard } from "@/hooks/use-secure-clipboard";

interface PasswordGeneratorProps {
    onSelect: (password: string) => void;
}

export function PasswordGenerator({ onSelect }: PasswordGeneratorProps) {
    const [password, setPassword] = useState("");
    const [length, setLength] = useState([16]);
    const [includeUppercase, setIncludeUppercase] = useState(true);
    const [includeLowercase, setIncludeLowercase] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [open, setOpen] = useState(false);
    const { isCopied, copy } = useSecureClipboard();

    const generatePassword = () => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

        let charset = "";
        if (includeUppercase) charset += uppercase;
        if (includeLowercase) charset += lowercase;
        if (includeNumbers) charset += numbers;
        if (includeSymbols) charset += symbols;

        if (charset === "") {
            setPassword("");
            return;
        }

        let newPassword = "";
        for (let i = 0; i < length[0]; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setPassword(newPassword);
    };

    // Generate on mount and when settings change
    useEffect(() => {
        generatePassword();
    }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

    const handleCopy = () => {
        copy(password);
    };

    const handleSelect = () => {
        onSelect(password);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                    title="Generate Password"
                >
                    <Wand2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-[#020617] border border-emerald-500/40 text-white shadow-xl shadow-emerald-500/10 p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-emerald-400">Password Generator</h4>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={generatePassword}
                            className="h-8 w-8 text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="relative">
                        <Input
                            value={password}
                            readOnly
                            className="bg-[#022c22] border-emerald-500/40 text-emerald-100 pr-10 font-mono text-sm"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="absolute right-1 top-1 h-7 w-7 text-gray-400 hover:text-emerald-300"
                        >
                            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Length</span>
                            <span>{length[0]}</span>
                        </div>
                        <Slider
                            value={length}
                            onValueChange={setLength}
                            max={64}
                            min={8}
                            step={1}
                            className="cursor-pointer"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="uppercase"
                                checked={includeUppercase}
                                onCheckedChange={(c) => setIncludeUppercase(c as boolean)}
                                className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <label
                                htmlFor="uppercase"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                            >
                                Uppercase
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="lowercase"
                                checked={includeLowercase}
                                onCheckedChange={(c) => setIncludeLowercase(c as boolean)}
                                className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <label
                                htmlFor="lowercase"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                            >
                                Lowercase
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="numbers"
                                checked={includeNumbers}
                                onCheckedChange={(c) => setIncludeNumbers(c as boolean)}
                                className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <label
                                htmlFor="numbers"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                            >
                                Numbers
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="symbols"
                                checked={includeSymbols}
                                onCheckedChange={(c) => setIncludeSymbols(c as boolean)}
                                className="border-emerald-500/50 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                            />
                            <label
                                htmlFor="symbols"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                            >
                                Symbols
                            </label>
                        </div>
                    </div>

                    <Button
                        onClick={handleSelect}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20"
                    >
                        Use Password
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
