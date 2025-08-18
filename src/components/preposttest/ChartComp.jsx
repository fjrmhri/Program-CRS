import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartComp({ raw }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const labels =
    screenWidth < 640
      ? raw.map((d) => (d.nama.length > 6 ? d.nama.slice(0, 6) + "…" : d.nama))
      : raw.map((d) => d.nama);

  const data = {
    labels,
    datasets: [
      {
        label: "Pre Test",
        data: raw.map((d) => d.pre),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderRadius: 6,
      },
      {
        label: "Post Test",
        data: raw.map((d) => d.post),
        backgroundColor: "rgba(16, 185, 129, 0.7)",
        borderRadius: 6,
      },
      {
        label: "Selisih",
        data: raw.map((d) => d.post - d.pre),
        backgroundColor: "rgba(234, 179, 8, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: screenWidth < 640 ? 10 : screenWidth < 1024 ? 12 : 14,
            family: "'Poppins', sans-serif",
          },
        },
      },
      title: {
        display: true,
        text: "Grafik Perbandingan Pre, Post, dan Selisih",
        font: {
          size: screenWidth < 640 ? 12 : screenWidth < 1024 ? 16 : 18,
          family: "'Poppins', sans-serif",
        },
      },
      tooltip: {
        bodyFont: {
          size: screenWidth < 640 ? 10 : 12,
          family: "'Poppins', sans-serif",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Nilai",
          font: { size: screenWidth < 640 ? 10 : 14 },
        },
        ticks: {
          stepSize: 10,
          font: { size: screenWidth < 640 ? 9 : 12 },
        },
      },
      x: {
        title: {
          display: true,
          text: "Peserta",
          font: { size: screenWidth < 640 ? 10 : 14 },
        },
        ticks: {
          font: { size: screenWidth < 640 ? 9 : 12 },
          autoSkip: true,
          maxRotation: screenWidth < 640 ? 45 : 0,
          minRotation: screenWidth < 640 ? 25 : 0,
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="w-full h-[260px] sm:h-[320px] md:h-[380px]">
      <Bar data={data} options={options} />
    </div>
  );
}
