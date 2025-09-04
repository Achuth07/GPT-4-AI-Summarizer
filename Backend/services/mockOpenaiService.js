export const extractMetadataAndSummarize = async (text) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock response based on the text content
  const mockResponse = {
    metadata: {
      authors: ["J. Logeshwaran", "M. Ramkumar", "T. Kiruthiga", "Sharan Pravin Ravi"],
      publicationYear: 2022,
      journal: "ICTACT Journal on Communication Technology"
    },
    summary: {
      abstract: "This research paper explores the role of Integrated Structured Cabling System (ISCS) for reliable bandwidth optimization in high-speed communication networks. The study focuses on improving network performance through structured cabling systems.",
      methodology: "The research employs simulation using Network Simulator (NS-2) with various performance metrics including resource blocking, resource dropping, bandwidth utilization, and energy consumption.",
      keyFindings: "The proposed ISCS model achieved 93.45% resource blocking, 6.55% dropping connectivity, and 92.54% bandwidth utilization, outperforming existing FSMA and JSPA algorithms.",
      proposedWayForward: "Future work should focus on implementing the ISCS model in real-world scenarios and exploring its application in 5G and 6G network architectures.",
      additionalInsights: "The study demonstrates that structured cabling systems significantly improve network efficiency and reliability while reducing energy consumption.",
      overallSummary: "Comprehensive analysis of structured cabling systems for optimized bandwidth in high-speed networks."
    }
  };
  
  return mockResponse;
};