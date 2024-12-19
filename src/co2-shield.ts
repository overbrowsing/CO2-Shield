type CO2Data = {
  co2: string;
  rating: string;
};

type RatingDetails = {
  color: string;
  details: string;
};

class CO2Shield {
  private formContainerId: string;

  constructor(formContainerId: string) {
    this.formContainerId = formContainerId;
  }

  public initialize(): void {
    this.createForm();
  }

  private createForm(): void {
    const container = document.getElementById(this.formContainerId);
    if (!container) {
      throw new Error(`Container with ID '${this.formContainerId}' not found.`);
    }

    container.innerHTML = `
      <form id="co2ShieldForm">
        <input id="websiteUrl" type="text" placeholder="Enter website URL" required>
        <button id="generateShieldButton" type="submit">Generate Shield</button>
      </form>
    `;

    const form = document.getElementById("co2ShieldForm") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent form submission
      this.generateShield();
    });
  }

  private async generateShield(): Promise<void> {
    const urlInput = document.getElementById("websiteUrl") as HTMLInputElement;
    const url = this.validateUrl(urlInput.value.trim());
    if (!url) return;

    const generateButton = document.getElementById(
      "generateShieldButton"
    ) as HTMLButtonElement;
    generateButton.textContent = "Loading...";
    generateButton.disabled = true;

    try {
      const { co2, rating } = await this.fetchCO2Data(url);
      const { color, details } = this.getRatingDetails(rating);

      const reportUrl = "https://overbrowsing.com/co2-shield";

      this.updateUI(
        this.generateShieldData(rating, co2, color, details, reportUrl),
        reportUrl,
        url
      );
    } catch (error) {
      alert("Error fetching data. Please try again later.");
    } finally {
      generateButton.textContent = "Generate Shield";
      generateButton.disabled = false;
    }
  }

  private validateUrl(url: string): string | null {
    if (!url) {
      alert("Please enter a valid website URL.");
      return null;
    }
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  private async fetchCO2Data(url: string): Promise<CO2Data> {
    const response = await fetch(
      `https://digitalbeacon.co/badge?url=${encodeURIComponent(url)}`
    );
    if (!response.ok) throw new Error("Failed to fetch CO2 data.");
    return response.json();
  }

  private getRatingDetails(rating: string): RatingDetails {
    const details: Record<string, RatingDetails> = {
      "a+": { color: "#4CAF50", details: "Less than 0.095g" },
      a: { color: "#8BC34A", details: "Less than 0.185g" },
      b: { color: "#FFC107", details: "Less than 0.34g" },
      c: { color: "#FF9800", details: "Less than 0.49g" },
      d: { color: "#FF5722", details: "Less than 0.65g" },
      e: { color: "#F44336", details: "Less than 0.85g" },
      f: { color: "#D32F2F", details: "Above 0.85g" },
    };

    return (
      details[rating.toLowerCase()] || {
        color: "#000",
        details: "Unknown rating",
      }
    );
  }

  private generateShieldData(
    rating: string,
    co2: string,
    color: string,
    details: string,
    reportUrl: string
  ) {
    const co2Message = `${parseFloat(co2).toFixed(2)}g`;
    const shieldUrl = `https://img.shields.io/badge/CO₂-${rating.toUpperCase()}_${co2Message.replace(
      / /g,
      "_"
    )}-${color.replace("#", "")}`;
    const markdown = `[![CO₂ Shield](${shieldUrl})](${reportUrl})`;

    return {
      shieldUrl,
      markdown,
      details,
      rating,
      detailsList: this.generateDetailsList(),
    };
  }

  private generateDetailsList(): string {
    return ["a+", "a", "b", "c", "d", "e", "f"]
      .map((rating) => {
        const { color, details } = this.getRatingDetails(rating);
        return `<div class="rating-detail"><span style="color: ${color};">●</span> ${rating.toUpperCase()} • ${details}</div>`;
      })
      .join("");
  }

  private updateUI(
    { shieldUrl, markdown, details, detailsList, rating }: any,
    reportUrl: string,
    targetUrl: string
  ): void {
    const resultContainer = document.getElementById("result");
    if (resultContainer) resultContainer.remove();

    const container = document.createElement("div");
    container.id = "result";

    container.innerHTML = `
    <div>
      <h2>Results</h2>
      <p>${targetUrl} • ${rating.toUpperCase()} ${details}</p>
      <img src="${shieldUrl}">
      <pre>${markdown}</pre>
      <button id="copyMarkdown">Copy Markdown</button>
      <h2>Ratings</h2>
      <div class="rating-details">${detailsList}</div>
      <button id="resetButton">Reset</button>
    </div>
    `;

    const formContainer = document.getElementById(this.formContainerId);

    // Check if the form container exists and insert the result container after it
    if (formContainer) {
      formContainer.insertAdjacentElement("afterend", container);
    }

    const copyButton = document.getElementById("copyMarkdown")!;
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(markdown).then(() => {
        copyButton.textContent = "Copied!";
        setTimeout(() => (copyButton.textContent = "Copy Markdown"), 2000);
      });
    });

    const resetButton = document.getElementById("resetButton")!;
    resetButton.addEventListener("click", () => window.location.reload());
  }
}

export default CO2Shield;