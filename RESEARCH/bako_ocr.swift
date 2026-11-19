// macOS Vision OCR for text embedded inside the PDFs' family trees and charts.
// Usage: swift RESEARCH/bako_ocr.swift <PNG directory> <output.json>
import Foundation
import Vision
import ImageIO

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("Expected PNG directory and JSON output") }
let folder = URL(fileURLWithPath: args[1])
let urls = try FileManager.default.contentsOfDirectory(at: folder, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension == "png" }.sorted { $0.path < $1.path }
var results: [String: String] = [:]
for url in urls {
    autoreleasepool {
        do {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["en-US", "fr-FR"]
            // There is no Malagasy OCR dictionary; do not autocorrect Malagasy to English.
            request.usesLanguageCorrection = false
            try VNImageRequestHandler(url: url).perform([request])
            let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
            results[url.deletingPathExtension().lastPathComponent] = lines.joined(separator: "\n")
        } catch {
            fputs("OCR failed: \(url.lastPathComponent): \(error)\n", stderr)
        }
    }
}
let data = try JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted, .sortedKeys])
try data.write(to: URL(fileURLWithPath: args[2]))
print("OCR completed for \(results.count) pages")
