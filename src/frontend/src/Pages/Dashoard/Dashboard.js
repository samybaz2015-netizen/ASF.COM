import PowerBiEmbed from "./PowerBiEmbed";

const POWER_BI_REPORT_URL =
  "https://app.powerbi.com/view?r=eyJrIjoiMjY4OWIzMzgtNzQ2Yy00NDk3LWFlNTAtOTA5ODAwZjI2MGQ0IiwidCI6IjJiYjZlNWJjLWMxMDktNDdmYi05NDMzLWMxYzZmNGZhMzNmZiIsImMiOjl9";

const Dashboard = () => {
  return (
    <div className="h-screen w-full">
      <PowerBiEmbed src={POWER_BI_REPORT_URL} />
    </div>
  );
};

export default Dashboard;