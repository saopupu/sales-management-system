let applications = JSON.parse(localStorage.getItem("applications")) || [];

window.onload = function () {
    displayData();
};

function addApplication() {
    const application = {
        staff: document.getElementById("staff").value,
        applicationDate: document.getElementById("applicationDate").value,
        property: document.getElementById("property").value,
        customer: document.getElementById("customer").value,
        managementCompany: document.getElementById("managementCompany").value,
        installment: document.getElementById("installment").value,
        fee: Number(document.getElementById("fee").value) || 0,
        ad: Number(document.getElementById("ad").value) || 0
    };

    applications.push(application);

    localStorage.setItem("applications", JSON.stringify(applications));

    displayData();
    clearForm();

    alert("保存しました！");
}

function displayData() {
    const list = document.getElementById("applicationList");
    list.innerHTML = "";

    let total = 0;
    let summary = {
        "矢部": 0,
        "早坂": 0,
        "米山": 0,
        "吉田": 0
    };

    applications.forEach(function(item) {
        const sum = item.fee + item.ad;
        total += sum;
        summary[item.staff] += sum;

        list.innerHTML += `
            <tr>
                <td>${item.staff}</td>
                <td>${item.applicationDate}</td>
                <td>${item.property}</td>
                <td>${item.customer}</td>
                <td>${item.managementCompany}</td>
                <td>${item.installment}</td>
                <td>¥${item.fee.toLocaleString()}</td>
                <td>¥${item.ad.toLocaleString()}</td>
                <td>¥${sum.toLocaleString()}</td>
            </tr>
        `;
    });

    document.getElementById("staffSummary").innerHTML = `
        <p>矢部：¥${summary["矢部"].toLocaleString()}</p>
        <p>早坂：¥${summary["早坂"].toLocaleString()}</p>
        <p>米山：¥${summary["米山"].toLocaleString()}</p>
        <p>吉田：¥${summary["吉田"].toLocaleString()}</p>
    `;

    const target = 5000000;
    const rate = Math.round((total / target) * 100);

    document.getElementById("achievement").innerHTML =
        `現在：¥${total.toLocaleString()} / 達成率：${rate}%`;
}

function clearForm() {
    document.getElementById("applicationDate").value = "";
    document.getElementById("property").value = "";
    document.getElementById("customer").value = "";
    document.getElementById("managementCompany").value = "";
    document.getElementById("installment").value = "なし";
    document.getElementById("fee").value = "";
    document.getElementById("ad").value = "";
}