import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye } from 'lucide-react';
import type { UploadResult } from '@uppy/core';
import type { EstateDataCollection, MillDataCollection, TraceabilityDataCollection, KcpDataCollection, BulkingDataCollection } from '@shared/schema';

export default function LegalityAssessmentExpanded() {
  const [activeTab, setActiveTab] = useState('mill');
  const { toast } = useToast();

  // Form states for all collection types
  const [estateForm, setEstateForm] = useState({
    // Bagian 1 - Informasi Umum
    namaSupplier: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    linkDokumen: '',
    
    // Alamat
    alamatKantor: '',
    alamatKebun: '',
    
    // Koordinat
    koordinatKebun: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    totalProduksiTBSTahun: '',
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    
    // Bagian 2 - Sumber TBS (array of kebun)
    daftarKebun: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      luasLahan: 0,
      longitude: '',
      latitude: '',
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS1Tahun: ''
    }],
    
    // Bagian 3 - Perlindungan Hutan dan Gambut
    memilikiKebijakanPerlindunganHutan: false,
    memilikiKebijakanPerlindunganGambut: false
  });

  const [millForm, setMillForm] = useState({
    // Bagian 1 - Informasi Umum
    umlId: '',
    namaPabrik: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    
    // Alamat
    alamatKantor: '',
    alamatPabrik: '',
    
    // Koordinat
    koordinatPabrik: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    kuantitasCPOPK: '', // M/T
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    
    // Bagian 2 - Daftar Sumber TBS & Plot Produksi
    kebunInti: [{
      namaSupplier: '',
      alamat: '',
      luasPlotLahan: 0,
      longitude: '',
      latitude: '',
      polygonKebun: '',
      persenPasokanKeMill: 0,
      volumeTBSUntukPasokan: 0,
      dokumenLegalitasLahan: '', // document URL
      tahunTanam: ''
    }],
    kebunSepupu: [{
      namaSupplier: '',
      alamat: '',
      luasPlotLahan: 0,
      longitude: '',
      latitude: '',
      polygonKebun: '',
      persenPasokanKeMill: 0,
      volumeTBSUntukPasokan: 0,
      dokumenLegalitasLahan: '', // document URL
      tahunTanam: ''
    }],
    thirdPartied: [{
      namaSupplier: '',
      alamat: '',
      luasPlotLahan: 0,
      longitude: '',
      latitude: '',
      polygonKebun: '',
      persenPasokanKeMill: 0,
      volumeTBSUntukPasokan: 0,
      dokumenLegalitasLahan: '', // document URL
      tahunTanam: ''
    }]
  });

  const [traceabilityForm, setTraceabilityForm] = useState({
    nomorDO: '',
    pemegangDO: '',
    alamatPemegangDO: '',
    lokasiUsaha: '',
    aktaPendirianUsaha: '', // document URL
    nib: '',
    npwp: '',
    ktp: '', // document URL
    pemasokTBS: [{
      no: 1,
      namaPetani: '',
      alamatTempatTinggal: '',
      lokasiKebun: '',
      luas: 0, // Ha
      legalitasLahan: '', // document URL
      tahunTanam: '',
      stdb: '', // document URL
      sppl: '', // document URL
      nomorObjekPajakPBB: '',
      longitude: '',
      latitude: '',
    }]
  });

  const [kcpForm, setKcpForm] = useState({
    ublFacilityId: '',
    namaKCP: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatKCP: '',
    koordinatKantor: '',
    koordinatKCP: '',
    modelChainOfCustody: '',
    kapasitasOlahMTHari: 0,
    kapasitasOlah: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    daftarTangkiSilo: [{
      idTangkiSilo: '',
      kategori: '',
      produk: '',
      alamat: '',
      longitude: '',
      latitude: '',
      kapasitas: 0,
      tanggalCleaningTerakhir: '',
    }],
    sumberProduk: [{
      millId: '',
      namaPKS: '',
      alamat: '',
      longitude: '',
      latitude: '',
      produk: '',
      volume: 0,
      sertifikasi: '',
    }]
  });

  const [bulkingForm, setBulkingForm] = useState({
    ublFacilityId: '',
    namaFasilitasBulking: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatBulking: '',
    modelChainOfCustody: '',
    kapasitasTotal: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    daftarTangki: [{
      tankId: '',
      produk: '',
      kapasitas: 0,
      alamat: '',
      longitude: '',
      latitude: '',
      dedicatedShared: '',
      tanggalCleaningTerakhir: '',
    }],
    sumberProduk: [{
      millId: '',
      namaPKS: '',
      alamat: '',
      longitude: '',
      latitude: '',
      produk: '',
      volume: 0,
      sertifikasi: '',
    }]
  });

  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '',
    aktaPerubahan: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    alamatKantor: '',
    alamatKebun: '',
    koordinatKebun: '',
    koordinatKantor: '',
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    // Legal Compliance sections
    historisPerolehanTanah: false,
    historisKeterangan: '',
    izinPencadanganLahan: false,
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: false,
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: false,
    izinUsahaPerkebunanKeterangan: '',
    skHGU: false,
    skHGUKeterangan: '',
    sertifikatHGU: false,
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: false,
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: false,
    laporanLPUPKeterangan: '',
    izinLingkungan: false,
    izinLingkunganKeterangan: '',
    izinRintekTPS: false,
    izinRintekTPSKeterangan: '',
    izinPertekLimbah: false,
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: false,
    persetujuanAndalalinKeterangan: '',
    daftarPestisida: false,
    daftarPestisidaKeterangan: '',
    buktiPelaksanaanRKL: false,
    buktiPelaksanaanRKLKeterangan: '',
    laporanRKL: false,
    laporanRKLKeterangan: '',
    laporanPenggunaanPestisida: false,
    laporanPenggunaanPestisidaKeterangan: '',
    kesesuaianPeruntukan: false,
    kesesuaianPeruntukanKeterangan: '',
    skPelepasan: false,
    skPelepasanKeterangan: '',
    dokumenInstansiRelevan: false,
    dokumenInstansiRelevanKeterangan: '',
    kebijakanHakPihakKetiga: '',
    kebijakanHakPihakKetigaKeterangan: '',
    kebijakanPerusahaan: false,
    kebijakanPerusahaanKeterangan: '',
    sopGRTT: false,
    sopGRTTKeterangan: '',
    sopPADIATAPA: false,
    sopPADIATAPAKeterangan: '',
    sopPenangananInformasi: false,
    sopPenangananInformasiKeterangan: '',
    sopPenangananKeluhan: false,
    sopPenangananKeluhanKeterangan: '',
    mouKerjaSama: false,
    mouKerjaSamaKeterangan: '',
    skCPCL: false,
    skCPCLKeterangan: '',
    laporanRealisasiPlasma: false,
    laporanRealisasiPlasmaKeterangan: ''
  });

  // Sample dummy data for demonstration
  const dummyEstateData = [
    {
      id: 'estate-001',
      namaSupplier: 'PT Sawit Makmur Jaya',
      namaGroup: 'Grup Perkebunan Nusantara',
      izinBerusaha: 'NIB-1234567890',
      tipeSertifikat: 'RSPO',
      nomorSertifikat: 'RSPO-2024-001',
      status: 'completed',
      lembagaSertifikasi: 'Lembaga Sertifikasi RSPO Indonesia',
      kapasitasProduksi: 15000,
      jenisProduk: 'CPO, PKO',
      tahunBerdiri: 2015
    },
    {
      id: 'estate-002', 
      namaSupplier: 'CV Kebun Sejahtera',
      namaGroup: 'Grup Mandiri Perkebunan',
      izinBerusaha: 'NIB-2345678901',
      tipeSertifikat: 'ISPO',
      nomorSertifikat: 'ISPO-2024-002',
      status: 'draft',
      lembagaSertifikasi: 'BSN Indonesia',
      kapasitasProduksi: 8500,
      jenisProduk: 'TBS, CPO',
      tahunBerdiri: 2018
    }
  ];

  const dummyMillData = [
    {
      id: 'mill-001',
      namaPabrik: 'PKS Riau Makmur',
      namaGroup: 'Grup Perkebunan Nusantara',
      izinBerusaha: 'NIB-3456789012',
      tipeSertifikat: 'RSPO',
      nomorSertifikat: 'RSPO-PKS-001',
      status: 'completed',
      kapasitasOlah: 60,
      sistemPencatatan: 'Digital Integrated System'
    },
    {
      id: 'mill-002',
      namaPabrik: 'PKS Sumatra Indah',
      namaGroup: 'Grup Mandiri Perkebunan', 
      izinBerusaha: 'NIB-4567890123',
      tipeSertifikat: 'ISPO',
      nomorSertifikat: 'ISPO-PKS-002',
      status: 'completed',
      kapasitasOlah: 45,
      sistemPencatatan: 'Manual & Digital Hybrid'
    }
  ];

  const dummyTraceabilityData = [
    {
      id: 'trace-001',
      nomorDO: 'DO-2024-001',
      pemegangDO: 'PT Logistik Sawit Nusantara',
      alamatPemegangDO: 'Jl. Industri No. 45, Pekanbaru, Riau',
      status: 'completed',
      volumeTotal: 2500
    },
    {
      id: 'trace-002', 
      nomorDO: 'DO-2024-002',
      pemegangDO: 'CV Transport Kelapa Sawit',
      alamatPemegangDO: 'Jl. Perdagangan No. 12, Medan, Sumatera Utara',
      status: 'draft',
      volumeTotal: 1800
    }
  ];

  const dummyKcpData = [
    {
      id: 'kcp-001',
      namaKCP: 'KCP Riau Central',
      namaGroup: 'Grup Perkebunan Nusantara',
      kapasitasOlahMTHari: 150,
      sistemPencatatan: 'ERP Terintegrasi',
      status: 'completed',
      jumlahTangkiSilo: 8
    },
    {
      id: 'kcp-002',
      namaKCP: 'KCP Sumatra Barat',
      namaGroup: 'Grup Mandiri Perkebunan',
      kapasitasOlahMTHari: 120,
      sistemPencatatan: 'Manual System',
      status: 'completed', 
      jumlahTangkiSilo: 6
    }
  ];

  const dummyBulkingData = [
    {
      id: 'bulk-001',
      namaFasilitasBulking: 'Terminal Bulk Dumai',
      namaGroup: 'Grup Perkebunan Nusantara',
      kapasitasTotal: 50000,
      sistemPencatatan: 'Digital Warehouse Management',
      status: 'completed',
      jumlahTangki: 12
    },
    {
      id: 'bulk-002',
      namaFasilitasBulking: 'Storage Facility Belawan',
      namaGroup: 'Grup Mandiri Perkebunan',
      kapasitasTotal: 35000,
      sistemPencatatan: 'Semi-Digital System', 
      status: 'draft',
      jumlahTangki: 8
    }
  ];

  const dummySupplierComplianceData = [
    {
      id: 'compliance-001',
      namaSupplier: 'PT Sawit Makmur Jaya',
      tingkatKepatuhan: 95,
      statusKepatuhan: 'Sangat Patuh',
      tanggalPenilaian: '2024-08-25',
      nomorTeleponTimInternal: '+62-761-12345',
      emailKontak: 'compliance@sawitmakmur.co.id'
    },
    {
      id: 'compliance-002',
      namaSupplier: 'CV Kebun Sejahtera',
      tingkatKepatuhan: 78,
      statusKepatuhan: 'Patuh',
      tanggalPenilaian: '2024-08-20',
      nomorTeleponTimInternal: '+62-761-67890', 
      emailKontak: 'legal@kebunsejahtera.co.id'
    }
  ];

  // Fetch existing data collections, fallback to dummy data if empty
  const { data: apiEstateCollections = [] } = useQuery<EstateDataCollection[]>({
    queryKey: ['/api/estate-data-collection'],
  });

  const { data: apiMillCollections = [] } = useQuery<MillDataCollection[]>({
    queryKey: ['/api/mill-data-collection'],
  });

  const { data: apiTraceabilityCollections = [] } = useQuery<TraceabilityDataCollection[]>({
    queryKey: ['/api/traceability-data-collection'],
  });

  const { data: apiKcpCollections = [] } = useQuery<KcpDataCollection[]>({
    queryKey: ['/api/kcp-data-collection'],
  });

  const { data: apiBulkingCollections = [] } = useQuery<BulkingDataCollection[]>({
    queryKey: ['/api/bulking-data-collection'],
  });

  // Use dummy data to show populated results
  const estateCollections = apiEstateCollections.length > 0 ? apiEstateCollections : dummyEstateData;
  const millCollections = apiMillCollections.length > 0 ? apiMillCollections : dummyMillData;
  const traceabilityCollections = apiTraceabilityCollections.length > 0 ? apiTraceabilityCollections : dummyTraceabilityData;
  const kcpCollections = apiKcpCollections.length > 0 ? apiKcpCollections : dummyKcpData;
  const bulkingCollections = apiBulkingCollections.length > 0 ? apiBulkingCollections : dummyBulkingData;

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/estate-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      toast({
        title: "Data Estate berhasil disimpan",
        description: "Data Estate telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Data Mill berhasil disimpan",
        description: "Data Mill telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  const createTraceabilityMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/traceability-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/traceability-data-collection'] });
      toast({
        title: "Data Traceability berhasil disimpan",
        description: "Data Kemampuan Telusur (TBS Luar) telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  const createKcpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/kcp-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kcp-data-collection'] });
      toast({
        title: "Data KCP berhasil disimpan",
        description: "Data KCP telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  const createBulkingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bulking-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulking-data-collection'] });
      toast({
        title: "Data Bulking berhasil disimpan",
        description: "Data Bulking telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  const createSupplierComplianceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-compliance', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      toast({
        title: "Data Supplier Compliance berhasil disimpan",
        description: "Data Kepatuhan Hukum Supplier telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
  });

  // Document upload functionality
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST');
      return {
        method: 'PUT' as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string,
    formType: 'estate' | 'mill' | 'traceability' | 'kcp' | 'bulking' | 'supplier-compliance'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'mill') {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'traceability') {
        setTraceabilityForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'kcp') {
        setKcpForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'bulking') {
        setBulkingForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'supplier-compliance') {
        setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEstateMutation.mutate(estateForm);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMillMutation.mutate(millForm);
  };

  const handleTraceabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTraceabilityMutation.mutate(traceabilityForm);
  };

  const handleKcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKcpMutation.mutate(kcpForm);
  };

  const handleBulkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBulkingMutation.mutate(bulkingForm);
  };

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 data-testid="text-page-title" className="text-3xl font-bold">
                Penilaian Legalitas EUDR
              </h1>
              <p data-testid="text-page-description" className="text-muted-foreground mt-2">
                Sistem pengumpulan data komprehensif untuk kepatuhan EUDR dengan kemampuan unggah dokumen
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="estate" data-testid="tab-estate">Data Estate</TabsTrigger>
                <TabsTrigger value="mill" data-testid="tab-mill">Mill</TabsTrigger>
                <TabsTrigger value="traceability" data-testid="tab-traceability">Traceability TBS</TabsTrigger>
                <TabsTrigger value="kcp" data-testid="tab-kcp">KCP</TabsTrigger>
                <TabsTrigger value="bulking" data-testid="tab-bulking">Bulking</TabsTrigger>
                <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
                <TabsTrigger value="results" data-testid="tab-results">Hasil Koleksi Data</TabsTrigger>
              </TabsList>

              {/* Estate Data Collection Tab */}
              <TabsContent value="estate" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulir Pengumpulan Data</CardTitle>
                    <CardDescription>
                      (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEstateSubmit} className="space-y-8">
                      {/* Bagian 1 - Informasi Umum */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaSupplier">Nama Supplier</Label>
                            <Input
                              id="namaSupplier"
                              data-testid="input-nama-supplier-estate"
                              value={estateForm.namaSupplier}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                              placeholder="Masukkan nama supplier"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                            <Input
                              id="namaGroup"
                              data-testid="input-nama-group-estate"
                              value={estateForm.namaGroup}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                              placeholder="Masukkan nama group/parent company"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha)</Label>
                            <Input
                              id="izinBerusaha"
                              data-testid="input-izin-berusaha-estate"
                              value={estateForm.izinBerusaha}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipeSertifikat">Tipe Sertifikat Yang Dimiliki Perusahan</Label>
                            <Select
                              value={estateForm.tipeSertifikat}
                              onValueChange={(value) => setEstateForm(prev => ({ ...prev, tipeSertifikat: value }))}
                            >
                              <SelectTrigger data-testid="select-tipe-sertifikat-estate">
                                <SelectValue placeholder="Pilih tipe sertifikat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ISPO">ISPO</SelectItem>
                                <SelectItem value="RSPO">RSPO</SelectItem>
                                <SelectItem value="ISCC">ISCC</SelectItem>
                                <SelectItem value="PROPER LINGKUNGAN">PROPER LINGKUNGAN</SelectItem>
                                <SelectItem value="SMK3">SMK3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="nomorSertifikat">Nomor Sertifikat</Label>
                            <Input
                              id="nomorSertifikat"
                              data-testid="input-nomor-sertifikat-estate"
                              value={estateForm.nomorSertifikat}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                              placeholder="Masukkan nomor sertifikat"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lembagaSertifikasi">Lembaga Sertifikasi</Label>
                            <Input
                              id="lembagaSertifikasi"
                              data-testid="input-lembaga-sertifikasi-estate"
                              value={estateForm.lembagaSertifikasi}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                              placeholder="Masukkan lembaga sertifikasi"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="masaBerlakuSertifikat">Masa Berlaku Sertifikat</Label>
                            <Input
                              id="masaBerlakuSertifikat"
                              data-testid="input-masa-berlaku-sertifikat-estate"
                              type="date"
                              value={estateForm.masaBerlakuSertifikat}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ruangLingkupSertifikasi">Ruang Lingkup Sertifikasi</Label>
                          <Textarea
                            id="ruangLingkupSertifikasi"
                            data-testid="input-ruang-lingkup-sertifikasi-estate"
                            value={estateForm.ruangLingkupSertifikasi}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                            placeholder="Masukkan ruang lingkup sertifikasi"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="linkDokumen">Link Dokumen</Label>
                          <Input
                            id="linkDokumen"
                            data-testid="input-link-dokumen-estate"
                            value={estateForm.linkDokumen}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, linkDokumen: e.target.value }))}
                            placeholder="Masukkan link dokumen"
                          />
                        </div>
                      </div>

                      {/* Alamat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Alamat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="alamatKantor">Kantor</Label>
                            <Textarea
                              id="alamatKantor"
                              data-testid="input-alamat-kantor-estate"
                              value={estateForm.alamatKantor}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                              placeholder="Masukkan alamat kantor lengkap"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="alamatKebun">Kebun</Label>
                            <Textarea
                              id="alamatKebun"
                              data-testid="input-alamat-kebun-estate"
                              value={estateForm.alamatKebun}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                              placeholder="Masukkan alamat kebun lengkap"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Koordinat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Koordinat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKebun">Kebun</Label>
                            <Input
                              id="koordinatKebun"
                              data-testid="input-koordinat-kebun-estate"
                              value={estateForm.koordinatKebun}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKantor">Kantor</Label>
                            <Input
                              id="koordinatKantor"
                              data-testid="input-koordinat-kantor-estate"
                              value={estateForm.koordinatKantor}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Jenis Supplier Section */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Jenis Supplier</h4>
                        <Select
                          value={estateForm.jenisSupplier}
                          onValueChange={(value) => setEstateForm(prev => ({ ...prev, jenisSupplier: value }))}
                        >
                          <SelectTrigger data-testid="select-jenis-supplier-estate">
                            <SelectValue placeholder="Pilih jenis supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KKPA">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</SelectItem>
                            <SelectItem value="Sister Company">Kebun dalam satu grup manajemen (sister company)</SelectItem>
                            <SelectItem value="Pihak Ketiga">Kebun pihak ketiga (PT/ CV/ Koperasi)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="totalProduksiTBSTahun">Total Produksi TBS / Tahun (kurun 1 tahun terakhir)</Label>
                          <Input
                            id="totalProduksiTBSTahun"
                            data-testid="input-total-produksi-tbs-estate"
                            value={estateForm.totalProduksiTBSTahun}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, totalProduksiTBSTahun: e.target.value }))}
                            placeholder="Masukkan total produksi TBS"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tanggalPengisianKuisioner">Tanggal Pengisian Kuisioner</Label>
                          <Input
                            id="tanggalPengisianKuisioner"
                            data-testid="input-tanggal-pengisian-estate"
                            type="date"
                            value={estateForm.tanggalPengisianKuisioner}
                            onChange={(e) => setEstateForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Penanggung Jawab Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Penanggung Jawab</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaPenanggungJawab">Nama</Label>
                            <Input
                              id="namaPenanggungJawab"
                              data-testid="input-nama-penanggung-jawab-estate"
                              value={estateForm.namaPenanggungJawab}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nama penanggung jawab"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanPenanggungJawab">Jabatan</Label>
                            <Input
                              id="jabatanPenanggungJawab"
                              data-testid="input-jabatan-penanggung-jawab-estate"
                              value={estateForm.jabatanPenanggungJawab}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailPenanggungJawab">Email</Label>
                            <Input
                              id="emailPenanggungJawab"
                              data-testid="input-email-penanggung-jawab-estate"
                              type="email"
                              value={estateForm.emailPenanggungJawab}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonPenanggungJawab">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonPenanggungJawab"
                              data-testid="input-nomor-telepon-penanggung-jawab-estate"
                              value={estateForm.nomorTelefonPenanggungJawab}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tim Internal Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaTimInternal">Nama</Label>
                            <Input
                              id="namaTimInternal"
                              data-testid="input-nama-tim-internal-estate"
                              value={estateForm.namaTimInternal}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                              placeholder="Masukkan nama tim internal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanTimInternal">Jabatan</Label>
                            <Input
                              id="jabatanTimInternal"
                              data-testid="input-jabatan-tim-internal-estate"
                              value={estateForm.jabatanTimInternal}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailTimInternal">Email</Label>
                            <Input
                              id="emailTimInternal"
                              data-testid="input-email-tim-internal-estate"
                              type="email"
                              value={estateForm.emailTimInternal}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonTimInternal">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonTimInternal"
                              data-testid="input-nomor-telepon-tim-internal-estate"
                              value={estateForm.nomorTelefonTimInternal}
                              onChange={(e) => setEstateForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Document Upload Sections */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Dokumen</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Akta Pendirian Perusahaan</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'aktaPendirian', 'estate')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah Akta Pendirian
                            </ObjectUploader>
                            {estateForm.aktaPendirian && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Akta Perubahan (Jika Ada)</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'estate')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah Akta Perubahan
                            </ObjectUploader>
                            {estateForm.aktaPerubahan && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-estate"
                        className="w-full" 
                        disabled={createEstateMutation.isPending}
                      >
                        {createEstateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Estate'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mill Data Collection Tab */}
              <TabsContent value="mill" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulir Pengumpulan Data</CardTitle>
                    <CardDescription>
                      Pabrik
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleMillSubmit} className="space-y-8">
                      {/* Bagian 1 - Informasi Umum */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="umlId">UML ID</Label>
                            <Input
                              id="umlId"
                              data-testid="input-uml-id-mill"
                              value={millForm.umlId}
                              onChange={(e) => setMillForm(prev => ({ ...prev, umlId: e.target.value }))}
                              placeholder="Masukkan UML ID"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="namaPabrik">Nama Pabrik</Label>
                            <Input
                              id="namaPabrik"
                              data-testid="input-nama-pabrik-mill"
                              value={millForm.namaPabrik}
                              onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                              placeholder="Masukkan nama pabrik"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="namaGroupMill">Nama Group / Parent Company Name</Label>
                          <Input
                            id="namaGroupMill"
                            data-testid="input-nama-group-mill"
                            value={millForm.namaGroup}
                            onChange={(e) => setMillForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                            placeholder="Masukkan nama group/parent company"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="izinBerusahaMill">Izin Berusaha (Nomor Induk Berusaha)</Label>
                            <Input
                              id="izinBerusahaMill"
                              data-testid="input-izin-berusaha-mill"
                              value={millForm.izinBerusaha}
                              onChange={(e) => setMillForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipeSertifikatMill">Tipe Sertifikat Yang Dimiliki Perusahan</Label>
                            <Select
                              value={millForm.tipeSertifikat}
                              onValueChange={(value) => setMillForm(prev => ({ ...prev, tipeSertifikat: value }))}
                            >
                              <SelectTrigger data-testid="select-tipe-sertifikat-mill">
                                <SelectValue placeholder="Pilih tipe sertifikat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ISPO">ISPO</SelectItem>
                                <SelectItem value="RSPO">RSPO</SelectItem>
                                <SelectItem value="ISCC">ISCC</SelectItem>
                                <SelectItem value="PROPER LINGKUNGAN">PROPER LINGKUNGAN</SelectItem>
                                <SelectItem value="SMK3">SMK3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="nomorSertifikatMill">Nomor Sertifikat</Label>
                            <Input
                              id="nomorSertifikatMill"
                              data-testid="input-nomor-sertifikat-mill"
                              value={millForm.nomorSertifikat}
                              onChange={(e) => setMillForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                              placeholder="Masukkan nomor sertifikat"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lembagaSertifikasiMill">Lembaga Sertifikasi</Label>
                            <Input
                              id="lembagaSertifikasiMill"
                              data-testid="input-lembaga-sertifikasi-mill"
                              value={millForm.lembagaSertifikasi}
                              onChange={(e) => setMillForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                              placeholder="Masukkan lembaga sertifikasi"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="masaBerlakuSertifikatMill">Masa Berlaku Sertifikat</Label>
                            <Input
                              id="masaBerlakuSertifikatMill"
                              data-testid="input-masa-berlaku-sertifikat-mill"
                              type="date"
                              value={millForm.masaBerlakuSertifikat}
                              onChange={(e) => setMillForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ruangLingkupSertifikasiMill">Ruang Lingkup Sertifikasi</Label>
                          <Textarea
                            id="ruangLingkupSertifikasiMill"
                            data-testid="input-ruang-lingkup-sertifikasi-mill"
                            value={millForm.ruangLingkupSertifikasi}
                            onChange={(e) => setMillForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                            placeholder="Masukkan ruang lingkup sertifikasi"
                          />
                        </div>
                      </div>

                      {/* Alamat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Alamat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="alamatKantorMill">Kantor</Label>
                            <Textarea
                              id="alamatKantorMill"
                              data-testid="input-alamat-kantor-mill"
                              value={millForm.alamatKantor}
                              onChange={(e) => setMillForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                              placeholder="Masukkan alamat kantor lengkap"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="alamatPabrik">Pabrik</Label>
                            <Textarea
                              id="alamatPabrik"
                              data-testid="input-alamat-pabrik-mill"
                              value={millForm.alamatPabrik}
                              onChange={(e) => setMillForm(prev => ({ ...prev, alamatPabrik: e.target.value }))}
                              placeholder="Masukkan alamat pabrik lengkap"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Koordinat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Koordinat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="koordinatPabrik">Pabrik</Label>
                            <Input
                              id="koordinatPabrik"
                              data-testid="input-koordinat-pabrik-mill"
                              value={millForm.koordinatPabrik}
                              onChange={(e) => setMillForm(prev => ({ ...prev, koordinatPabrik: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKantorMill">Kantor</Label>
                            <Input
                              id="koordinatKantorMill"
                              data-testid="input-koordinat-kantor-mill"
                              value={millForm.koordinatKantor}
                              onChange={(e) => setMillForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Jenis Supplier Section */}
                      <div className="space-y-4">
                        <h4 className="text-md font-semibold">Jenis Supplier</h4>
                        <Select
                          value={millForm.jenisSupplier}
                          onValueChange={(value) => setMillForm(prev => ({ ...prev, jenisSupplier: value }))}
                        >
                          <SelectTrigger data-testid="select-jenis-supplier-mill">
                            <SelectValue placeholder="Pilih jenis supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KKPA">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</SelectItem>
                            <SelectItem value="Sister Company">Kebun dalam satu grup manajemen (sister company)</SelectItem>
                            <SelectItem value="Pihak Ketiga">Kebun pihak ketiga (PT/ CV/ Koperasi)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="kuantitasCPOPK">Kuantitas CPO/PK (M/T)</Label>
                          <Input
                            id="kuantitasCPOPK"
                            data-testid="input-kuantitas-cpo-pk-mill"
                            value={millForm.kuantitasCPOPK}
                            onChange={(e) => setMillForm(prev => ({ ...prev, kuantitasCPOPK: e.target.value }))}
                            placeholder="Masukkan kuantitas CPO/PK"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tanggalPengisianKuisionerMill">Tanggal Pengisian Kuisioner</Label>
                          <Input
                            id="tanggalPengisianKuisionerMill"
                            data-testid="input-tanggal-pengisian-mill"
                            type="date"
                            value={millForm.tanggalPengisianKuisioner}
                            onChange={(e) => setMillForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Penanggung Jawab Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Penanggung Jawab</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaPenanggungJawabMill">Nama</Label>
                            <Input
                              id="namaPenanggungJawabMill"
                              data-testid="input-nama-penanggung-jawab-mill"
                              value={millForm.namaPenanggungJawab}
                              onChange={(e) => setMillForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nama penanggung jawab"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanPenanggungJawabMill">Jabatan</Label>
                            <Input
                              id="jabatanPenanggungJawabMill"
                              data-testid="input-jabatan-penanggung-jawab-mill"
                              value={millForm.jabatanPenanggungJawab}
                              onChange={(e) => setMillForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailPenanggungJawabMill">Email</Label>
                            <Input
                              id="emailPenanggungJawabMill"
                              data-testid="input-email-penanggung-jawab-mill"
                              type="email"
                              value={millForm.emailPenanggungJawab}
                              onChange={(e) => setMillForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonPenanggungJawabMill">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonPenanggungJawabMill"
                              data-testid="input-nomor-telepon-penanggung-jawab-mill"
                              value={millForm.nomorTelefonPenanggungJawab}
                              onChange={(e) => setMillForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tim Internal Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaTimInternalMill">Nama</Label>
                            <Input
                              id="namaTimInternalMill"
                              data-testid="input-nama-tim-internal-mill"
                              value={millForm.namaTimInternal}
                              onChange={(e) => setMillForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                              placeholder="Masukkan nama tim internal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanTimInternalMill">Jabatan</Label>
                            <Input
                              id="jabatanTimInternalMill"
                              data-testid="input-jabatan-tim-internal-mill"
                              value={millForm.jabatanTimInternal}
                              onChange={(e) => setMillForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailTimInternalMill">Email</Label>
                            <Input
                              id="emailTimInternalMill"
                              data-testid="input-email-tim-internal-mill"
                              type="email"
                              value={millForm.emailTimInternal}
                              onChange={(e) => setMillForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonTimInternalMill">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonTimInternalMill"
                              data-testid="input-nomor-telepon-tim-internal-mill"
                              value={millForm.nomorTelefonTimInternal}
                              onChange={(e) => setMillForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bagian 2 - Daftar Sumber TBS & Plot Produksi */}
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Sumber TBS & Plot Produksi</h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Cantumkan setiap unit pemasok, beserta geolokasi plot asal TBS yang memasok ke pabrik.
                          </p>
                        </div>

                        {/* Kebun Inti Section */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold">Kebun Inti</h4>
                          {millForm.kebunInti.map((kebun, index) => (
                            <Card key={index} className="p-4 bg-blue-50">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="font-medium">Kebun Inti {index + 1}</h5>
                                  {millForm.kebunInti.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun.splice(index, 1);
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                    >
                                      Hapus
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Nama Supplier</Label>
                                    <Input
                                      value={kebun.namaSupplier}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].namaSupplier = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="Masukkan nama supplier"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Alamat</Label>
                                    <Input
                                      value={kebun.alamat}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].alamat = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="Masukkan alamat"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Luas Plot Lahan (Ha)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.luasPlotLahan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].luasPlotLahan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>% Pasokan Ke Mill</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      max="100"
                                      value={kebun.persenPasokanKeMill}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].persenPasokanKeMill = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="0.0"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Volume TBS untuk Pasokan Ini</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.volumeTBSUntukPasokan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].volumeTBSUntukPasokan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label>Longitude</Label>
                                    <Input
                                      value={kebun.longitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].longitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="117.1436"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Latitude</Label>
                                    <Input
                                      value={kebun.latitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].latitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="-2.5489"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Polygon Kebun</Label>
                                    <Input
                                      value={kebun.polygonKebun}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].polygonKebun = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="Data polygon"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Tahun Tanam</Label>
                                    <Input
                                      value={kebun.tahunTanam}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunInti];
                                        newKebun[index].tahunTanam = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                      }}
                                      placeholder="2015"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Dokumen Legalitas Lahan (HGU/HGB/dll)</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newKebun = [...millForm.kebunInti];
                                      newKebun[index].dokumenLegalitasLahan = result.successful[0]?.uploadURL || '';
                                      setMillForm(prev => ({ ...prev, kebunInti: newKebun }));
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Unggah Dokumen Legalitas Lahan
                                  </ObjectUploader>
                                  {kebun.dokumenLegalitasLahan && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Dokumen telah diunggah
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newKebun = {
                                namaSupplier: '',
                                alamat: '',
                                luasPlotLahan: 0,
                                longitude: '',
                                latitude: '',
                                polygonKebun: '',
                                persenPasokanKeMill: 0,
                                volumeTBSUntukPasokan: 0,
                                dokumenLegalitasLahan: '',
                                tahunTanam: ''
                              };
                              setMillForm(prev => ({
                                ...prev,
                                kebunInti: [...prev.kebunInti, newKebun]
                              }));
                            }}
                            className="w-full"
                          >
                            + Tambah Kebun Inti
                          </Button>
                        </div>

                        {/* Kebun Sepupu Section */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold">Kebun Sepupu</h4>
                          {millForm.kebunSepupu.map((kebun, index) => (
                            <Card key={index} className="p-4 bg-green-50">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="font-medium">Kebun Sepupu {index + 1}</h5>
                                  {millForm.kebunSepupu.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun.splice(index, 1);
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                    >
                                      Hapus
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Nama Supplier</Label>
                                    <Input
                                      value={kebun.namaSupplier}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].namaSupplier = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="Masukkan nama supplier"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Alamat</Label>
                                    <Input
                                      value={kebun.alamat}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].alamat = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="Masukkan alamat"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Luas Plot Lahan (Ha)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.luasPlotLahan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].luasPlotLahan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>% Pasokan Ke Mill</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      max="100"
                                      value={kebun.persenPasokanKeMill}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].persenPasokanKeMill = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="0.0"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Volume TBS untuk Pasokan Ini</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.volumeTBSUntukPasokan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].volumeTBSUntukPasokan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label>Longitude</Label>
                                    <Input
                                      value={kebun.longitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].longitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="117.1436"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Latitude</Label>
                                    <Input
                                      value={kebun.latitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].latitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="-2.5489"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Polygon Kebun</Label>
                                    <Input
                                      value={kebun.polygonKebun}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].polygonKebun = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="Data polygon"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Tahun Tanam</Label>
                                    <Input
                                      value={kebun.tahunTanam}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.kebunSepupu];
                                        newKebun[index].tahunTanam = e.target.value;
                                        setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                      }}
                                      placeholder="2015"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Dokumen Legalitas Lahan (HGU/HGB/dll)</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newKebun = [...millForm.kebunSepupu];
                                      newKebun[index].dokumenLegalitasLahan = result.successful[0]?.uploadURL || '';
                                      setMillForm(prev => ({ ...prev, kebunSepupu: newKebun }));
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Unggah Dokumen Legalitas Lahan
                                  </ObjectUploader>
                                  {kebun.dokumenLegalitasLahan && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Dokumen telah diunggah
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newKebun = {
                                namaSupplier: '',
                                alamat: '',
                                luasPlotLahan: 0,
                                longitude: '',
                                latitude: '',
                                polygonKebun: '',
                                persenPasokanKeMill: 0,
                                volumeTBSUntukPasokan: 0,
                                dokumenLegalitasLahan: '',
                                tahunTanam: ''
                              };
                              setMillForm(prev => ({
                                ...prev,
                                kebunSepupu: [...prev.kebunSepupu, newKebun]
                              }));
                            }}
                            className="w-full"
                          >
                            + Tambah Kebun Sepupu
                          </Button>
                        </div>

                        {/* Third-Partied Section */}
                        <div className="space-y-4">
                          <h4 className="text-md font-semibold">Third-Partied ( PT/CV/KUD)</h4>
                          {millForm.thirdPartied.map((kebun, index) => (
                            <Card key={index} className="p-4 bg-orange-50">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h5 className="font-medium">Third-Partied {index + 1}</h5>
                                  {millForm.thirdPartied.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun.splice(index, 1);
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                    >
                                      Hapus
                                    </Button>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Nama Supplier</Label>
                                    <Input
                                      value={kebun.namaSupplier}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].namaSupplier = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="Masukkan nama supplier"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Alamat</Label>
                                    <Input
                                      value={kebun.alamat}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].alamat = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="Masukkan alamat"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Luas Plot Lahan (Ha)</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.luasPlotLahan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].luasPlotLahan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>% Pasokan Ke Mill</Label>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      max="100"
                                      value={kebun.persenPasokanKeMill}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].persenPasokanKeMill = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="0.0"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Volume TBS untuk Pasokan Ini</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={kebun.volumeTBSUntukPasokan}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].volumeTBSUntukPasokan = parseFloat(e.target.value) || 0;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label>Longitude</Label>
                                    <Input
                                      value={kebun.longitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].longitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="117.1436"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Latitude</Label>
                                    <Input
                                      value={kebun.latitude}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].latitude = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="-2.5489"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Polygon Kebun</Label>
                                    <Input
                                      value={kebun.polygonKebun}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].polygonKebun = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="Data polygon"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Tahun Tanam</Label>
                                    <Input
                                      value={kebun.tahunTanam}
                                      onChange={(e) => {
                                        const newKebun = [...millForm.thirdPartied];
                                        newKebun[index].tahunTanam = e.target.value;
                                        setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                      }}
                                      placeholder="2015"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Dokumen Legalitas Lahan (HGU/HGB/dll)</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newKebun = [...millForm.thirdPartied];
                                      newKebun[index].dokumenLegalitasLahan = result.successful[0]?.uploadURL || '';
                                      setMillForm(prev => ({ ...prev, thirdPartied: newKebun }));
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Unggah Dokumen Legalitas Lahan
                                  </ObjectUploader>
                                  {kebun.dokumenLegalitasLahan && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Dokumen telah diunggah
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const newKebun = {
                                namaSupplier: '',
                                alamat: '',
                                luasPlotLahan: 0,
                                longitude: '',
                                latitude: '',
                                polygonKebun: '',
                                persenPasokanKeMill: 0,
                                volumeTBSUntukPasokan: 0,
                                dokumenLegalitasLahan: '',
                                tahunTanam: ''
                              };
                              setMillForm(prev => ({
                                ...prev,
                                thirdPartied: [...prev.thirdPartied, newKebun]
                              }));
                            }}
                            className="w-full"
                          >
                            + Tambah Third-Partied
                          </Button>
                        </div>
                      </div>

                      {/* Document Upload Sections */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Dokumen</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Akta Pendirian Perusahaan</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'aktaPendirian', 'mill')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah Akta Pendirian
                            </ObjectUploader>
                            {millForm.aktaPendirian && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Akta Perubahan (Jika Ada)</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'mill')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah Akta Perubahan
                            </ObjectUploader>
                            {millForm.aktaPerubahan && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-mill"
                        className="w-full" 
                        disabled={createMillMutation.isPending}
                      >
                        {createMillMutation.isPending ? 'Menyimpan...' : 'Simpan Data Mill'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Traceability Tab */}
              <TabsContent value="traceability" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Kemampuan Telusur (Traceability) TBS Luar</CardTitle>
                    <CardDescription>
                      Unit Usaha Kecil Menengah/Small Medium Enterprise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTraceabilitySubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="nomorDO">Nomor DO</Label>
                          <Input
                            id="nomorDO"
                            data-testid="input-nomor-do"
                            value={traceabilityForm.nomorDO}
                            onChange={(e) => setTraceabilityForm(prev => ({ ...prev, nomorDO: e.target.value }))}
                            placeholder="Masukkan nomor DO"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="pemegangDO">Pemegang DO</Label>
                          <Input
                            id="pemegangDO"
                            data-testid="input-pemegang-do"
                            value={traceabilityForm.pemegangDO}
                            onChange={(e) => setTraceabilityForm(prev => ({ ...prev, pemegangDO: e.target.value }))}
                            placeholder="Masukkan nama pemegang DO"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alamatPemegangDO">Alamat Pemegang DO</Label>
                        <Textarea
                          id="alamatPemegangDO"
                          data-testid="input-alamat-pemegang-do"
                          value={traceabilityForm.alamatPemegangDO}
                          onChange={(e) => setTraceabilityForm(prev => ({ ...prev, alamatPemegangDO: e.target.value }))}
                          placeholder="Masukkan alamat pemegang DO"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lokasiUsaha">Lokasi Usaha</Label>
                        <Input
                          id="lokasiUsaha"
                          data-testid="input-lokasi-usaha"
                          value={traceabilityForm.lokasiUsaha}
                          onChange={(e) => setTraceabilityForm(prev => ({ ...prev, lokasiUsaha: e.target.value }))}
                          placeholder="Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu"
                        />
                        <p className="text-xs text-muted-foreground">
                          ( Lokasi Ramp / Alamat Terdaftar CV / Koperasi / Usaha Individu  )
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Legalitas Pemegang DO</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="nib">NIB</Label>
                            <Input
                              id="nib"
                              data-testid="input-nib-traceability"
                              value={traceabilityForm.nib}
                              onChange={(e) => setTraceabilityForm(prev => ({ ...prev, nib: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="npwp">NPWP</Label>
                            <Input
                              id="npwp"
                              data-testid="input-npwp-traceability"
                              value={traceabilityForm.npwp}
                              onChange={(e) => setTraceabilityForm(prev => ({ ...prev, npwp: e.target.value }))}
                              placeholder="Masukkan NPWP"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Akta Pendirian Usaha ( Jika Berbadan Hukum)</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'aktaPendirianUsaha', 'traceability')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah Akta Pendirian
                            </ObjectUploader>
                            {traceabilityForm.aktaPendirianUsaha && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>KTP (Jika Usaha Individu)</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'ktp', 'traceability')}
                              buttonClassName="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Unggah KTP
                            </ObjectUploader>
                            {traceabilityForm.ktp && (
                              <Badge variant="secondary" className="text-xs">
                                <FileText className="w-3 h-3 mr-1" />
                                Dokumen telah diunggah
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pemasok TBS Section */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Pemasok TBS</h3>
                        
                        {traceabilityForm.pemasokTBS.map((pemasok, index) => (
                          <Card key={index} className="p-4 bg-gray-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Pemasok {index + 1}</h4>
                                {traceabilityForm.pemasokTBS.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok.splice(index, 1);
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Nama Petani</Label>
                                  <Input
                                    value={pemasok.namaPetani}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].namaPetani = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Masukkan nama petani"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Alamat Tempat Tinggal</Label>
                                  <Input
                                    value={pemasok.alamatTempatTinggal}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].alamatTempatTinggal = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Masukkan alamat tempat tinggal"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Lokasi Kebun</Label>
                                  <Input
                                    value={pemasok.lokasiKebun}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].lokasiKebun = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="< 4 Ha : Titik Koordinat ≥ 4 Ha : Polygon"
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    ( &lt; 4 Ha : Titik Koordinat ≥ 4 Ha : Polygon )
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label>Longitude</Label>
                                  <Input
                                    value={pemasok.longitude}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].longitude = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Contoh: 117.1436"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Latitude</Label>
                                  <Input
                                    value={pemasok.latitude}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].latitude = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Contoh: -2.5489"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Luas (Ha)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={pemasok.luas}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].luas = parseFloat(e.target.value) || 0;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Tahun Tanam</Label>
                                  <Input
                                    value={pemasok.tahunTanam}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].tahunTanam = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Contoh: 2015"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Nomor Objek Pajak PBB</Label>
                                  <Input
                                    value={pemasok.nomorObjekPajakPBB}
                                    onChange={(e) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].nomorObjekPajakPBB = e.target.value;
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    placeholder="Masukkan nomor objek pajak PBB"
                                  />
                                </div>
                              </div>

                              {/* Document uploads for this pemasok */}
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Legalitas Lahan</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].legalitasLahan = result.successful[0]?.uploadURL || '';
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    buttonClassName="w-full text-xs py-1"
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Unggah
                                  </ObjectUploader>
                                  {pemasok.legalitasLahan && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Terunggah
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>STDB</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].stdb = result.successful[0]?.uploadURL || '';
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    buttonClassName="w-full text-xs py-1"
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Unggah
                                  </ObjectUploader>
                                  {pemasok.stdb && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Terunggah
                                    </Badge>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label>SPPL</Label>
                                  <ObjectUploader
                                    onGetUploadParameters={handleGetUploadParameters}
                                    onComplete={(result) => {
                                      const newPemasok = [...traceabilityForm.pemasokTBS];
                                      newPemasok[index].sppl = result.successful[0]?.uploadURL || '';
                                      setTraceabilityForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                                    }}
                                    buttonClassName="w-full text-xs py-1"
                                  >
                                    <Upload className="w-3 h-3 mr-1" />
                                    Unggah
                                  </ObjectUploader>
                                  {pemasok.sppl && (
                                    <Badge variant="secondary" className="text-xs">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Terunggah
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newPemasok = {
                              no: traceabilityForm.pemasokTBS.length + 1,
                              namaPetani: '',
                              alamatTempatTinggal: '',
                              lokasiKebun: '',
                              longitude: '',
                              latitude: '',
                              luas: 0,
                              legalitasLahan: '',
                              tahunTanam: '',
                              stdb: '',
                              sppl: '',
                              nomorObjekPajakPBB: ''
                            };
                            setTraceabilityForm(prev => ({
                              ...prev,
                              pemasokTBS: [...prev.pemasokTBS, newPemasok]
                            }));
                          }}
                          className="w-full"
                        >
                          + Tambah Pemasok TBS
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-traceability"
                        className="w-full" 
                        disabled={createTraceabilityMutation.isPending}
                      >
                        {createTraceabilityMutation.isPending ? 'Menyimpan...' : 'Simpan Data Traceability TBS'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* KCP Tab */}
              <TabsContent value="kcp" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulir Pengumpulan Data</CardTitle>
                    <CardDescription>
                      KCP
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleKcpSubmit} className="space-y-8">
                      {/* Bagian 1 - Informasi Umum */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="ublFacilityId">UBL / Facility ID</Label>
                            <Input
                              id="ublFacilityId"
                              data-testid="input-ubl-facility-id-kcp"
                              value={kcpForm.ublFacilityId}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                              placeholder="Masukkan UBL / Facility ID"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="namaKCP">Nama KCP</Label>
                            <Input
                              id="namaKCP"
                              data-testid="input-nama-kcp"
                              value={kcpForm.namaKCP}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, namaKCP: e.target.value }))}
                              placeholder="Masukkan nama KCP"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="namaGroupKCP">Nama Group / Parent Company Name</Label>
                          <Input
                            id="namaGroupKCP"
                            data-testid="input-nama-group-kcp"
                            value={kcpForm.namaGroup}
                            onChange={(e) => setKcpForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                            placeholder="Masukkan nama group/parent company"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="izinBerusahaKCP">Izin Berusaha (Nomor Induk Berusaha)</Label>
                            <Input
                              id="izinBerusahaKCP"
                              data-testid="input-izin-berusaha-kcp"
                              value={kcpForm.izinBerusaha}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipeSertifikatKCP">Tipe Sertifikat Yang Dimiliki Perusahan</Label>
                            <Select
                              value={kcpForm.tipeSertifikat}
                              onValueChange={(value) => setKcpForm(prev => ({ ...prev, tipeSertifikat: value }))}
                            >
                              <SelectTrigger data-testid="select-tipe-sertifikat-kcp">
                                <SelectValue placeholder="Pilih tipe sertifikat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ISPO">ISPO</SelectItem>
                                <SelectItem value="RSPO">RSPO</SelectItem>
                                <SelectItem value="ISCC">ISCC</SelectItem>
                                <SelectItem value="PROPER">PROPER</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="nomorSertifikatKCP">Nomor Sertifikat</Label>
                            <Input
                              id="nomorSertifikatKCP"
                              data-testid="input-nomor-sertifikat-kcp"
                              value={kcpForm.nomorSertifikat}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                              placeholder="Masukkan nomor sertifikat"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lembagaSertifikasiKCP">Lembaga Sertifikasi</Label>
                            <Input
                              id="lembagaSertifikasiKCP"
                              data-testid="input-lembaga-sertifikasi-kcp"
                              value={kcpForm.lembagaSertifikasi}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                              placeholder="Masukkan lembaga sertifikasi"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="masaBerlakuSertifikatKCP">Masa Berlaku Sertifikat</Label>
                            <Input
                              id="masaBerlakuSertifikatKCP"
                              data-testid="input-masa-berlaku-sertifikat-kcp"
                              type="date"
                              value={kcpForm.masaBerlakuSertifikat}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ruangLingkupSertifikasiKCP">Ruang Lingkup Sertifikasi</Label>
                          <Textarea
                            id="ruangLingkupSertifikasiKCP"
                            data-testid="input-ruang-lingkup-sertifikasi-kcp"
                            value={kcpForm.ruangLingkupSertifikasi}
                            onChange={(e) => setKcpForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                            placeholder="Masukkan ruang lingkup sertifikasi"
                          />
                        </div>
                      </div>

                      {/* Alamat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Alamat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="alamatKantorKCP">Kantor</Label>
                            <Textarea
                              id="alamatKantorKCP"
                              data-testid="input-alamat-kantor-kcp"
                              value={kcpForm.alamatKantor}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                              placeholder="Masukkan alamat kantor lengkap"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="alamatKCP">KCP</Label>
                            <Textarea
                              id="alamatKCP"
                              data-testid="input-alamat-kcp"
                              value={kcpForm.alamatKCP}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, alamatKCP: e.target.value }))}
                              placeholder="Masukkan alamat KCP lengkap"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Koordinat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Koordinat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKantorKCP">Kantor</Label>
                            <Input
                              id="koordinatKantorKCP"
                              data-testid="input-koordinat-kantor-kcp"
                              value={kcpForm.koordinatKantor}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKCP">KCP</Label>
                            <Input
                              id="koordinatKCP"
                              data-testid="input-koordinat-kcp"
                              value={kcpForm.koordinatKCP}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, koordinatKCP: e.target.value }))}
                              placeholder="Contoh: -2.5489, 117.1436"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Operasional Section */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="modelChainOfCustody">Model Chain Of Custody</Label>
                            <Input
                              id="modelChainOfCustody"
                              data-testid="input-model-chain-of-custody-kcp"
                              value={kcpForm.modelChainOfCustody}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, modelChainOfCustody: e.target.value }))}
                              placeholder="Masukkan model chain of custody"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="kapasitasOlah">Kapasitas Olah (MT/Hari)</Label>
                            <Input
                              id="kapasitasOlah"
                              data-testid="input-kapasitas-olah-kcp"
                              value={kcpForm.kapasitasOlah}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlah: e.target.value }))}
                              placeholder="Masukkan kapasitas olah"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="sistemPencatatanKCP">Sistem Pencatatan (LIFO/FIFO/Weighted)</Label>
                            <Select
                              value={kcpForm.sistemPencatatan}
                              onValueChange={(value) => setKcpForm(prev => ({ ...prev, sistemPencatatan: value }))}
                            >
                              <SelectTrigger data-testid="select-sistem-pencatatan-kcp">
                                <SelectValue placeholder="Pilih sistem pencatatan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LIFO">LIFO</SelectItem>
                                <SelectItem value="FIFO">FIFO</SelectItem>
                                <SelectItem value="Weighted">Weighted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tanggalPengisianKuisionerKCP">Tanggal Pengisian Kuisioner</Label>
                            <Input
                              id="tanggalPengisianKuisionerKCP"
                              data-testid="input-tanggal-pengisian-kcp"
                              type="date"
                              value={kcpForm.tanggalPengisianKuisioner}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Penanggung Jawab Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Penanggung Jawab</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaPenanggungJawabKCP">Nama</Label>
                            <Input
                              id="namaPenanggungJawabKCP"
                              data-testid="input-nama-penanggung-jawab-kcp"
                              value={kcpForm.namaPenanggungJawab}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nama penanggung jawab"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanPenanggungJawabKCP">Jabatan</Label>
                            <Input
                              id="jabatanPenanggungJawabKCP"
                              data-testid="input-jabatan-penanggung-jawab-kcp"
                              value={kcpForm.jabatanPenanggungJawab}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailPenanggungJawabKCP">Email</Label>
                            <Input
                              id="emailPenanggungJawabKCP"
                              data-testid="input-email-penanggung-jawab-kcp"
                              type="email"
                              value={kcpForm.emailPenanggungJawab}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonPenanggungJawabKCP">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonPenanggungJawabKCP"
                              data-testid="input-nomor-telepon-penanggung-jawab-kcp"
                              value={kcpForm.nomorTelefonPenanggungJawab}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tim Internal Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaTimInternalKCP">Nama</Label>
                            <Input
                              id="namaTimInternalKCP"
                              data-testid="input-nama-tim-internal-kcp"
                              value={kcpForm.namaTimInternal}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                              placeholder="Masukkan nama tim internal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanTimInternalKCP">Jabatan</Label>
                            <Input
                              id="jabatanTimInternalKCP"
                              data-testid="input-jabatan-tim-internal-kcp"
                              value={kcpForm.jabatanTimInternal}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailTimInternalKCP">Email</Label>
                            <Input
                              id="emailTimInternalKCP"
                              data-testid="input-email-tim-internal-kcp"
                              type="email"
                              value={kcpForm.emailTimInternal}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonTimInternalKCP">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonTimInternalKCP"
                              data-testid="input-nomor-telepon-tim-internal-kcp"
                              value={kcpForm.nomorTelefonTimInternal}
                              onChange={(e) => setKcpForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bagian 2 - Daftar Tangki / Silo */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Tangki / Silo</h3>
                        </div>

                        {kcpForm.daftarTangkiSilo.map((tangki, index) => (
                          <Card key={index} className="p-4 bg-purple-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Tangki / Silo {index + 1}</h4>
                                {kcpForm.daftarTangkiSilo.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki.splice(index, 1);
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>ID Tanki /Silo</Label>
                                  <Input
                                    value={tangki.idTangkiSilo}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].idTangkiSilo = e.target.value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                    placeholder="Masukkan ID tangki/silo"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Kategori (Raw Kernel/CPKO/PKC)</Label>
                                  <Select
                                    value={tangki.kategori}
                                    onValueChange={(value) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].kategori = value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Raw Kernel">Raw Kernel</SelectItem>
                                      <SelectItem value="CPKO">CPKO</SelectItem>
                                      <SelectItem value="PKC">PKC</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Produk</Label>
                                  <Input
                                    value={tangki.produk}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].produk = e.target.value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                    placeholder="Masukkan produk"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Alamat</Label>
                                <Input
                                  value={tangki.alamat}
                                  onChange={(e) => {
                                    const newTangki = [...kcpForm.daftarTangkiSilo];
                                    newTangki[index].alamat = e.target.value;
                                    setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                  }}
                                  placeholder="Masukkan alamat tangki/silo"
                                />
                              </div>

                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Longitude</Label>
                                  <Input
                                    value={tangki.longitude}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].longitude = e.target.value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                    placeholder="117.1436"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Latitude</Label>
                                  <Input
                                    value={tangki.latitude}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].latitude = e.target.value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                    placeholder="-2.5489"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Kapasitas</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={tangki.kapasitas}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].kapasitas = parseFloat(e.target.value) || 0;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Tanggal Cleaning Terakhir</Label>
                                  <Input
                                    type="date"
                                    value={tangki.tanggalCleaningTerakhir}
                                    onChange={(e) => {
                                      const newTangki = [...kcpForm.daftarTangkiSilo];
                                      newTangki[index].tanggalCleaningTerakhir = e.target.value;
                                      setKcpForm(prev => ({ ...prev, daftarTangkiSilo: newTangki }));
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newTangki = {
                              idTangkiSilo: '',
                              kategori: '',
                              produk: '',
                              alamat: '',
                              longitude: '',
                              latitude: '',
                              kapasitas: 0,
                              tanggalCleaningTerakhir: ''
                            };
                            setKcpForm(prev => ({
                              ...prev,
                              daftarTangkiSilo: [...prev.daftarTangkiSilo, newTangki]
                            }));
                          }}
                          className="w-full"
                        >
                          + Tambah Tangki / Silo
                        </Button>
                      </div>

                      {/* Bagian 3 - Sumber Produk */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold border-b pb-2">Bagian 3 – Sumber Produk</h3>
                        </div>

                        {kcpForm.sumberProduk.map((sumber, index) => (
                          <Card key={index} className="p-4 bg-teal-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Sumber Produk {index + 1}</h4>
                                {kcpForm.sumberProduk.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber.splice(index, 1);
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Mill ID</Label>
                                  <Input
                                    value={sumber.millId}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].millId = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan Mill ID"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Nama PKS</Label>
                                  <Input
                                    value={sumber.namaPKS}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].namaPKS = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan nama PKS"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Alamat</Label>
                                  <Input
                                    value={sumber.alamat}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].alamat = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan alamat"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Longitude</Label>
                                  <Input
                                    value={sumber.longitude}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].longitude = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="117.1436"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Latitude</Label>
                                  <Input
                                    value={sumber.latitude}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].latitude = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="-2.5489"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Produk</Label>
                                  <Input
                                    value={sumber.produk}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].produk = e.target.value;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan produk"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Volume</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={sumber.volume}
                                    onChange={(e) => {
                                      const newSumber = [...kcpForm.sumberProduk];
                                      newSumber[index].volume = parseFloat(e.target.value) || 0;
                                      setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Sertifikasi (ISPO/RSPO/ISCC)</Label>
                                <Select
                                  value={sumber.sertifikasi}
                                  onValueChange={(value) => {
                                    const newSumber = [...kcpForm.sumberProduk];
                                    newSumber[index].sertifikasi = value;
                                    setKcpForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih sertifikasi" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ISPO">ISPO</SelectItem>
                                    <SelectItem value="RSPO">RSPO</SelectItem>
                                    <SelectItem value="ISCC">ISCC</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newSumber = {
                              millId: '',
                              namaPKS: '',
                              alamat: '',
                              longitude: '',
                              latitude: '',
                              produk: '',
                              volume: 0,
                              sertifikasi: ''
                            };
                            setKcpForm(prev => ({
                              ...prev,
                              sumberProduk: [...prev.sumberProduk, newSumber]
                            }));
                          }}
                          className="w-full"
                        >
                          + Tambah Sumber Produk
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-kcp"
                        className="w-full" 
                        disabled={createKcpMutation.isPending}
                      >
                        {createKcpMutation.isPending ? 'Menyimpan...' : 'Simpan Data KCP'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bulking Tab */}
              <TabsContent value="bulking" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulir Pengumpulan Data</CardTitle>
                    <CardDescription>
                      Bulking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBulkingSubmit} className="space-y-8">
                      {/* Bagian 1 - Informasi Umum */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="ublFacilityIdBulking">UBL / Facility ID</Label>
                            <Input
                              id="ublFacilityIdBulking"
                              data-testid="input-ubl-facility-id-bulking"
                              value={bulkingForm.ublFacilityId}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, ublFacilityId: e.target.value }))}
                              placeholder="Masukkan UBL / Facility ID"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="namaFasilitasBulking">Nama Fasilitas Bulking</Label>
                            <Input
                              id="namaFasilitasBulking"
                              data-testid="input-nama-fasilitas-bulking"
                              value={bulkingForm.namaFasilitasBulking}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, namaFasilitasBulking: e.target.value }))}
                              placeholder="Masukkan nama fasilitas bulking"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="namaGroupBulking">Nama Group / Parent Company Name</Label>
                          <Input
                            id="namaGroupBulking"
                            data-testid="input-nama-group-bulking"
                            value={bulkingForm.namaGroup}
                            onChange={(e) => setBulkingForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                            placeholder="Masukkan nama group/parent company"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="izinBerusahaBulking">Izin Berusaha (Nomor Induk Berusaha)</Label>
                            <Input
                              id="izinBerusahaBulking"
                              data-testid="input-izin-berusaha-bulking"
                              value={bulkingForm.izinBerusaha}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipeSertifikatBulking">Tipe Sertifikat Yang Dimiliki Perusahan</Label>
                            <Select
                              value={bulkingForm.tipeSertifikat}
                              onValueChange={(value) => setBulkingForm(prev => ({ ...prev, tipeSertifikat: value }))}
                            >
                              <SelectTrigger data-testid="select-tipe-sertifikat-bulking">
                                <SelectValue placeholder="Pilih tipe sertifikat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ISPO">ISPO</SelectItem>
                                <SelectItem value="RSPO">RSPO</SelectItem>
                                <SelectItem value="ISCC">ISCC</SelectItem>
                                <SelectItem value="PROPER">PROPER</SelectItem>
                                <SelectItem value="Lainnya">Lainnya</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="nomorSertifikatBulking">Nomor Sertifikat</Label>
                            <Input
                              id="nomorSertifikatBulking"
                              data-testid="input-nomor-sertifikat-bulking"
                              value={bulkingForm.nomorSertifikat}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                              placeholder="Masukkan nomor sertifikat"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lembagaSertifikasiBulking">Lembaga Sertifikasi</Label>
                            <Input
                              id="lembagaSertifikasiBulking"
                              data-testid="input-lembaga-sertifikasi-bulking"
                              value={bulkingForm.lembagaSertifikasi}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                              placeholder="Masukkan lembaga sertifikasi"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="masaBerlakuSertifikatBulking">Masa Berlaku Sertifikat</Label>
                            <Input
                              id="masaBerlakuSertifikatBulking"
                              data-testid="input-masa-berlaku-sertifikat-bulking"
                              type="date"
                              value={bulkingForm.masaBerlakuSertifikat}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ruangLingkupSertifikasiBulking">Ruang Lingkup Sertifikasi</Label>
                          <Textarea
                            id="ruangLingkupSertifikasiBulking"
                            data-testid="input-ruang-lingkup-sertifikasi-bulking"
                            value={bulkingForm.ruangLingkupSertifikasi}
                            onChange={(e) => setBulkingForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                            placeholder="Masukkan ruang lingkup sertifikasi"
                          />
                        </div>
                      </div>

                      {/* Alamat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Alamat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="alamatKantorBulking">Kantor</Label>
                            <Textarea
                              id="alamatKantorBulking"
                              data-testid="input-alamat-kantor-bulking"
                              value={bulkingForm.alamatKantor}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                              placeholder="Masukkan alamat kantor lengkap"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="alamatBulking">Bulking</Label>
                            <Textarea
                              id="alamatBulking"
                              data-testid="input-alamat-bulking"
                              value={bulkingForm.alamatBulking}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, alamatBulking: e.target.value }))}
                              placeholder="Masukkan alamat bulking lengkap"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Koordinat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Koordinat</h4>
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="modelChainOfCustodyBulking">Model Chain Of Custody</Label>
                            <Input
                              id="modelChainOfCustodyBulking"
                              data-testid="input-model-chain-of-custody-bulking"
                              value={bulkingForm.modelChainOfCustody}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, modelChainOfCustody: e.target.value }))}
                              placeholder="Masukkan model chain of custody"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="kapasitasTotal">Kapasitas Total</Label>
                            <Input
                              id="kapasitasTotal"
                              data-testid="input-kapasitas-total-bulking"
                              value={bulkingForm.kapasitasTotal}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, kapasitasTotal: parseFloat(e.target.value) || 0 }))}
                              placeholder="Masukkan kapasitas total"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="sistemPencatatanBulking">Sistem Pencatatan (LIFO/FIFO)</Label>
                            <Select
                              value={bulkingForm.sistemPencatatan}
                              onValueChange={(value) => setBulkingForm(prev => ({ ...prev, sistemPencatatan: value }))}
                            >
                              <SelectTrigger data-testid="select-sistem-pencatatan-bulking">
                                <SelectValue placeholder="Pilih sistem pencatatan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LIFO">LIFO</SelectItem>
                                <SelectItem value="FIFO">FIFO</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tanggalPengisianKuisionerBulking">Tanggal Pengisian Kuisioner</Label>
                          <Input
                            id="tanggalPengisianKuisionerBulking"
                            data-testid="input-tanggal-pengisian-bulking"
                            type="date"
                            value={bulkingForm.tanggalPengisianKuisioner}
                            onChange={(e) => setBulkingForm(prev => ({ ...prev, tanggalPengisianKuisioner: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Penanggung Jawab Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Penanggung Jawab</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaPenanggungJawabBulking">Nama</Label>
                            <Input
                              id="namaPenanggungJawabBulking"
                              data-testid="input-nama-penanggung-jawab-bulking"
                              value={bulkingForm.namaPenanggungJawab}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nama penanggung jawab"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanPenanggungJawabBulking">Jabatan</Label>
                            <Input
                              id="jabatanPenanggungJawabBulking"
                              data-testid="input-jabatan-penanggung-jawab-bulking"
                              value={bulkingForm.jabatanPenanggungJawab}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailPenanggungJawabBulking">Email</Label>
                            <Input
                              id="emailPenanggungJawabBulking"
                              data-testid="input-email-penanggung-jawab-bulking"
                              type="email"
                              value={bulkingForm.emailPenanggungJawab}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonPenanggungJawabBulking">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonPenanggungJawabBulking"
                              data-testid="input-nomor-telepon-penanggung-jawab-bulking"
                              value={bulkingForm.nomorTelefonPenanggungJawab}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tim Internal Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaTimInternalBulking">Nama</Label>
                            <Input
                              id="namaTimInternalBulking"
                              data-testid="input-nama-tim-internal-bulking"
                              value={bulkingForm.namaTimInternal}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                              placeholder="Masukkan nama tim internal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanTimInternalBulking">Jabatan</Label>
                            <Input
                              id="jabatanTimInternalBulking"
                              data-testid="input-jabatan-tim-internal-bulking"
                              value={bulkingForm.jabatanTimInternal}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailTimInternalBulking">Email</Label>
                            <Input
                              id="emailTimInternalBulking"
                              data-testid="input-email-tim-internal-bulking"
                              type="email"
                              value={bulkingForm.emailTimInternal}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTeleponTimInternalBulking">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTeleponTimInternalBulking"
                              data-testid="input-nomor-telepon-tim-internal-bulking"
                              value={bulkingForm.nomorTeleponTimInternal}
                              onChange={(e) => setBulkingForm(prev => ({ ...prev, nomorTeleponTimInternal: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bagian 2 - Daftar Tangki */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Tangki</h3>
                        </div>

                        {bulkingForm.daftarTangki.map((tangki, index) => (
                          <Card key={index} className="p-4 bg-yellow-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Tangki {index + 1}</h4>
                                {bulkingForm.daftarTangki.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki.splice(index, 1);
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Tank ID</Label>
                                  <Input
                                    value={tangki.tankId}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].tankId = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                    placeholder="Masukkan Tank ID"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Produk</Label>
                                  <Input
                                    value={tangki.produk}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].produk = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                    placeholder="Masukkan produk"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Kapasitas</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={tangki.kapasitas}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].kapasitas = parseFloat(e.target.value) || 0;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Alamat</Label>
                                <Input
                                  value={tangki.alamat}
                                  onChange={(e) => {
                                    const newTangki = [...bulkingForm.daftarTangki];
                                    newTangki[index].alamat = e.target.value;
                                    setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                  }}
                                  placeholder="Masukkan alamat tangki"
                                />
                              </div>

                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Longitude</Label>
                                  <Input
                                    value={tangki.longitude}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].longitude = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                    placeholder="117.1436"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Latitude</Label>
                                  <Input
                                    value={tangki.latitude}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].latitude = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                    placeholder="-2.5489"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Dedicated/Shared</Label>
                                  <Select
                                    value={tangki.dedicatedShared}
                                    onValueChange={(value) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].dedicatedShared = value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih tipe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Dedicated">Dedicated</SelectItem>
                                      <SelectItem value="Shared">Shared</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Tanggal Cleaning Terakhir</Label>
                                  <Input
                                    type="date"
                                    value={tangki.tanggalCleaningTerakhir}
                                    onChange={(e) => {
                                      const newTangki = [...bulkingForm.daftarTangki];
                                      newTangki[index].tanggalCleaningTerakhir = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, daftarTangki: newTangki }));
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newTangki = {
                              tankId: '',
                              produk: '',
                              kapasitas: 0,
                              alamat: '',
                              longitude: '',
                              latitude: '',
                              dedicatedShared: '',
                              tanggalCleaningTerakhir: ''
                            };
                            setBulkingForm(prev => ({
                              ...prev,
                              daftarTangki: [...prev.daftarTangki, newTangki]
                            }));
                          }}
                          className="w-full"
                        >
                          + Tambah Tangki
                        </Button>
                      </div>

                      {/* Bagian 3 - Sumber Produk */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold border-b pb-2">Bagian 3- Sumber Produk</h3>
                        </div>

                        {bulkingForm.sumberProduk.map((sumber, index) => (
                          <Card key={index} className="p-4 bg-cyan-50">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium">Sumber Produk {index + 1}</h4>
                                {bulkingForm.sumberProduk.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber.splice(index, 1);
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                  >
                                    Hapus
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Mill ID</Label>
                                  <Input
                                    value={sumber.millId}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].millId = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan Mill ID"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Nama PKS</Label>
                                  <Input
                                    value={sumber.namaPKS}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].namaPKS = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan nama PKS"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Alamat</Label>
                                  <Input
                                    value={sumber.alamat}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].alamat = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan alamat"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <Label>Long</Label>
                                  <Input
                                    value={sumber.longitude}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].longitude = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="117.1436"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Lat</Label>
                                  <Input
                                    value={sumber.latitude}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].latitude = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="-2.5489"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Produk</Label>
                                  <Input
                                    value={sumber.produk}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].produk = e.target.value;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="Masukkan produk"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Volume</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={sumber.volume}
                                    onChange={(e) => {
                                      const newSumber = [...bulkingForm.sumberProduk];
                                      newSumber[index].volume = parseFloat(e.target.value) || 0;
                                      setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                    }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Sertifikasi (ISPO/RSPO/ISCC)</Label>
                                <Select
                                  value={sumber.sertifikasi}
                                  onValueChange={(value) => {
                                    const newSumber = [...bulkingForm.sumberProduk];
                                    newSumber[index].sertifikasi = value;
                                    setBulkingForm(prev => ({ ...prev, sumberProduk: newSumber }));
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih sertifikasi" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ISPO">ISPO</SelectItem>
                                    <SelectItem value="RSPO">RSPO</SelectItem>
                                    <SelectItem value="ISCC">ISCC</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newSumber = {
                              millId: '',
                              namaPKS: '',
                              alamat: '',
                              longitude: '',
                              latitude: '',
                              produk: '',
                              volume: 0,
                              sertifikasi: ''
                            };
                            setBulkingForm(prev => ({
                              ...prev,
                              sumberProduk: [...prev.sumberProduk, newSumber]
                            }));
                          }}
                          className="w-full"
                        >
                          + Tambah Sumber Produk
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-bulking"
                        className="w-full" 
                        disabled={createBulkingMutation.isPending}
                      >
                        {createBulkingMutation.isPending ? 'Menyimpan...' : 'Simpan Data Bulking'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Supplier Compliance Tab */}
              <TabsContent value="supplier-compliance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                    <CardDescription>
                      (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSupplierComplianceSubmit} className="space-y-8">
                      {/* Basic Information */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaSupplierCompliance">Nama Supplier</Label>
                            <Input
                              id="namaSupplierCompliance"
                              data-testid="input-nama-supplier-compliance"
                              value={supplierComplianceForm.namaSupplier}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                              placeholder="Masukkan nama supplier"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="namaGroupCompliance">Nama Group / Parent Company Name</Label>
                            <Input
                              id="namaGroupCompliance"
                              data-testid="input-nama-group-compliance"
                              value={supplierComplianceForm.namaGroup}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                              placeholder="Masukkan nama group/parent company"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="aktaPendirianCompliance">Akta Pendirian Perusahaan</Label>
                            <Input
                              id="aktaPendirianCompliance"
                              data-testid="input-akta-pendirian-compliance"
                              value={supplierComplianceForm.aktaPendirianPerusahaan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                              placeholder="Masukkan nomor akta pendirian"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="aktaPerubahanCompliance">Akta Perubahan (Jika Ada)</Label>
                            <Input
                              id="aktaPerubahanCompliance"
                              data-testid="input-akta-perubahan-compliance"
                              value={supplierComplianceForm.aktaPerubahan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                              placeholder="Masukkan nomor akta perubahan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="izinBerusahaCompliance">Izin Berusaha (Nomor Induk Berusaha)</Label>
                            <Input
                              id="izinBerusahaCompliance"
                              data-testid="input-izin-berusaha-compliance"
                              value={supplierComplianceForm.izinBerusaha}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                              placeholder="Masukkan NIB"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="tipeSertifikatCompliance">Tipe Sertifikat Yang Dimiliki Perusahan</Label>
                            <Select
                              value={supplierComplianceForm.tipeSertifikat}
                              onValueChange={(value) => setSupplierComplianceForm(prev => ({ ...prev, tipeSertifikat: value }))}
                            >
                              <SelectTrigger data-testid="select-tipe-sertifikat-compliance">
                                <SelectValue placeholder="Pilih tipe sertifikat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ISPO">ISPO</SelectItem>
                                <SelectItem value="RSPO">RSPO</SelectItem>
                                <SelectItem value="ISCC">ISCC</SelectItem>
                                <SelectItem value="PROPER LINGKUNGAN">PROPER LINGKUNGAN</SelectItem>
                                <SelectItem value="SMK3">SMK3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Alamat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Alamat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="alamatKantorCompliance">Kantor</Label>
                            <Textarea
                              id="alamatKantorCompliance"
                              data-testid="input-alamat-kantor-compliance"
                              value={supplierComplianceForm.alamatKantor}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                              placeholder="Masukkan alamat kantor lengkap"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="alamatKebunCompliance">Kebun</Label>
                            <Textarea
                              id="alamatKebunCompliance"
                              data-testid="input-alamat-kebun-compliance"
                              value={supplierComplianceForm.alamatKebun}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                              placeholder="Masukkan alamat kebun lengkap"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Koordinat Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Koordinat</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKebunCompliance">Kebun</Label>
                            <Input
                              id="koordinatKebunCompliance"
                              data-testid="input-koordinat-kebun-compliance"
                              value={supplierComplianceForm.koordinatKebun}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                              placeholder="Masukkan koordinat kebun"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="koordinatKantorCompliance">Kantor</Label>
                            <Input
                              id="koordinatKantorCompliance"
                              data-testid="input-koordinat-kantor-compliance"
                              value={supplierComplianceForm.koordinatKantor}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                              placeholder="Masukkan koordinat kantor"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Jenis Supplier */}
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label>Jenis supplier</Label>
                          <div className="space-y-2">
                            {[
                              { value: 'KKPA', label: 'Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)' },
                              { value: 'sister-company', label: 'Kebun dalam satu grup manajemen (sister company)' },
                              { value: 'third-party', label: 'Kebun pihak ketiga (PT/ CV/ Koperasi)' }
                            ].map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={`jenisSupplier-${option.value}`}
                                  name="jenisSupplier"
                                  value={option.value}
                                  checked={supplierComplianceForm.jenisSupplier === option.value}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                                  className="w-4 h-4"
                                />
                                <Label htmlFor={`jenisSupplier-${option.value}`} className="text-sm font-normal cursor-pointer">
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Penanggung Jawab Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Penanggung Jawab</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaPenanggungJawabCompliance">Nama</Label>
                            <Input
                              id="namaPenanggungJawabCompliance"
                              data-testid="input-nama-penanggung-jawab-compliance"
                              value={supplierComplianceForm.namaPenanggungJawab}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nama penanggung jawab"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanPenanggungJawabCompliance">Jabatan</Label>
                            <Input
                              id="jabatanPenanggungJawabCompliance"
                              data-testid="input-jabatan-penanggung-jawab-compliance"
                              value={supplierComplianceForm.jabatanPenanggungJawab}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailPenanggungJawabCompliance">Email</Label>
                            <Input
                              id="emailPenanggungJawabCompliance"
                              data-testid="input-email-penanggung-jawab-compliance"
                              type="email"
                              value={supplierComplianceForm.emailPenanggungJawab}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonPenanggungJawabCompliance">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonPenanggungJawabCompliance"
                              data-testid="input-nomor-telepon-penanggung-jawab-compliance"
                              value={supplierComplianceForm.nomorTelefonPenanggungJawab}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tim Internal Section */}
                      <div className="space-y-6">
                        <h4 className="text-md font-semibold">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahan</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="namaTimInternalCompliance">Nama</Label>
                            <Input
                              id="namaTimInternalCompliance"
                              data-testid="input-nama-tim-internal-compliance"
                              value={supplierComplianceForm.namaTimInternal}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                              placeholder="Masukkan nama tim internal"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="jabatanTimInternalCompliance">Jabatan</Label>
                            <Input
                              id="jabatanTimInternalCompliance"
                              data-testid="input-jabatan-tim-internal-compliance"
                              value={supplierComplianceForm.jabatanTimInternal}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                              placeholder="Masukkan jabatan"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="emailTimInternalCompliance">Email</Label>
                            <Input
                              id="emailTimInternalCompliance"
                              data-testid="input-email-tim-internal-compliance"
                              type="email"
                              value={supplierComplianceForm.emailTimInternal}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                              placeholder="Masukkan email"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="nomorTelefonTimInternalCompliance">Nomor Telfon / Handphone</Label>
                            <Input
                              id="nomorTelefonTimInternalCompliance"
                              data-testid="input-nomor-telepon-tim-internal-compliance"
                              value={supplierComplianceForm.nomorTeleponTimInternal}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTeleponTimInternal: e.target.value }))}
                              placeholder="Masukkan nomor telepon"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Legal Compliance Section */}
                      <div className="space-y-8 bg-slate-50 p-6 rounded-lg">
                        <div className="text-center">
                          <h3 className="text-xl font-bold">Legal Compliance</h3>
                          <p className="text-sm text-muted-foreground mt-2">Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO</p>
                        </div>

                        {/* Hak Penggunaan Tanah */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold border-b pb-2">3.1 Hak Penggunaan Tanah</h4>
                          
                          <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                            <Label className="text-base font-medium">Apakah Perusahaan Memiliki Historis Perolehan Tanah</Label>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="historis-ya"
                                    name="historisPerolehanTanah"
                                    checked={supplierComplianceForm.historisPerolehanTanah}
                                    onChange={() => setSupplierComplianceForm(prev => ({ ...prev, historisPerolehanTanah: true }))}
                                  />
                                  <Label htmlFor="historis-ya">Ya</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="historis-tidak"
                                    name="historisPerolehanTanah"
                                    checked={!supplierComplianceForm.historisPerolehanTanah}
                                    onChange={() => setSupplierComplianceForm(prev => ({ ...prev, historisPerolehanTanah: false }))}
                                  />
                                  <Label htmlFor="historis-tidak">Tidak</Label>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Keterangan:</Label>
                                <Textarea
                                  value={supplierComplianceForm.historisKeterangan}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, historisKeterangan: e.target.value }))}
                                  placeholder="Masukkan keterangan..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Lampirkan Dokumen: (dalam Bentuk Google Drive)</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenHistoris', 'supplier-compliance')}
                                >
                                  <span>📁 Unggah Dokumen Historis</span>
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* Individual compliance items */}
                          {[
                            { key: 'izinPencadanganLahan', label: 'Izin Pencadangan Lahan' },
                            { key: 'persetujuanPKKPR', label: 'Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi' },
                            { key: 'izinUsahaPerkebunan', label: 'Izin Usaha Perkebunan' },
                            { key: 'skHGU', label: 'SK HGU' },
                            { key: 'sertifikatHGU', label: 'Sertipikat HGU' },
                            { key: 'laporanPemanfaatanHGU', label: 'Laporan Pemanfaatan HGU' },
                            { key: 'laporanLPUP', label: 'Laporan Perkembangan Usaha Perkebunan (LPUP)' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-purple-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder="Masukkan keterangan..."
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Perlindungan Lingkungan Hidup */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold border-b pb-2">3.2 Perlindungan Lingkungan Hidup</h4>
                          <p className="text-sm text-muted-foreground">Apakah Perusahaan Memiliki Perizinan Lingkungan Sesuai dengan Regulasi yang Relevan</p>
                          
                          {[
                            { key: 'izinLingkungan', label: 'Izin Lingkungan dan Dokumen Terkait' },
                            { key: 'izinRintekTPS', label: 'Izin / Rintek TPS Limbah B3' },
                            { key: 'izinPertekLimbah', label: 'Izin / Pertek Pengelolaan Limbah Cair Industri' },
                            { key: 'persetujuanAndalalin', label: 'Persetujuan Teknis ANDALALIN' },
                            { key: 'daftarPestisida', label: 'Daftar pestisida dan izin edar yang masih berlaku' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-green-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder="Masukkan keterangan..."
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}

                          {/* Section 3.3 */}
                          <div className="space-y-4 bg-green-50 p-4 rounded-lg">
                            <Label className="text-base font-semibold">3.3 Berikan Bukti Pelaksanaan prosedur point 3.2 diatas</Label>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="buktiPelaksanaan-ya"
                                  name="buktiPelaksanaanRKL"
                                  checked={supplierComplianceForm.buktiPelaksanaanRKL}
                                  onChange={() => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanRKL: true }))}
                                />
                                <Label htmlFor="buktiPelaksanaan-ya">Ya</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="buktiPelaksanaan-tidak"
                                  name="buktiPelaksanaanRKL"
                                  checked={!supplierComplianceForm.buktiPelaksanaanRKL}
                                  onChange={() => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanRKL: false }))}
                                />
                                <Label htmlFor="buktiPelaksanaan-tidak">Tidak</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Input
                                value={supplierComplianceForm.buktiPelaksanaanRKLKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanRKLKeterangan: e.target.value }))}
                                placeholder="Masukkan keterangan..."
                              />
                            </div>
                          </div>

                          {[
                            { key: 'laporanRKL', label: 'Laporan Pelaksanaan RKL/RPL' },
                            { key: 'laporanPenggunaanPestisida', label: 'Laporan Penggunaan Pestisida' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-green-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder="Masukkan keterangan..."
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Peraturan Kehutanan */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold border-b pb-2">3.4 Peraturan yang berhubungan dengan Kehutanan</h4>
                          
                          {[
                            { key: 'kesesuaianPeruntukan', label: 'Apakah area yang diusahakan sesuai dengan peruntukannya' },
                            { key: 'skPelepasan', label: 'SK Pelepasan/Tukar Menukar Kawasan Hutan (Jika Kawasan berasal dari kawasan hutan negara)' },
                            { key: 'dokumenInstansiRelevan', label: 'Dokumen yang dikeluarkan oleh Instansi relevan menunjukan kesesuain ruang area tanam (PKKPR, Risalah Panitia B, Tinjauan Teknis dari Kehutanan)' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-amber-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder="Masukkan keterangan..."
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Hak Pihak Ketiga */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold border-b pb-2">3.5 Hak Pihak Ke 3 termasuk Hak-Hak Masyarakat adat</h4>
                          
                          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                            <Label className="text-base font-medium">Apakah Perusahaan Memiliki Kebijakan Terkait Hak pihak ketiga, prinsip persetujuan awal tanpa paksaan dan berdasarkan informasi (FPIC), termasuk Hak-Hak Masyarakat Adat</Label>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="kebijakanHak-ya"
                                    name="kebijakanHakPihakKetiga"
                                    value="Ya"
                                    checked={supplierComplianceForm.kebijakanHakPihakKetiga === 'Ya'}
                                    onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetiga: e.target.value }))}
                                  />
                                  <Label htmlFor="kebijakanHak-ya">Ya</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="kebijakanHak-tidak"
                                    name="kebijakanHakPihakKetiga"
                                    value="Tidak"
                                    checked={supplierComplianceForm.kebijakanHakPihakKetiga === 'Tidak'}
                                    onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetiga: e.target.value }))}
                                  />
                                  <Label htmlFor="kebijakanHak-tidak">Tidak</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    id="kebijakanHak-tidak-relevan"
                                    name="kebijakanHakPihakKetiga"
                                    value="Tidak relevan"
                                    checked={supplierComplianceForm.kebijakanHakPihakKetiga === 'Tidak relevan'}
                                    onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetiga: e.target.value }))}
                                  />
                                  <Label htmlFor="kebijakanHak-tidak-relevan">Tidak relevan</Label>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Keterangan:</Label>
                                <Input
                                  value={supplierComplianceForm.kebijakanHakPihakKetigaKeterangan}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, kebijakanHakPihakKetigaKeterangan: e.target.value }))}
                                  placeholder="Masukkan keterangan..."
                                />
                              </div>
                            </div>
                          </div>

                          {[
                            { key: 'kebijakanPerusahaan', label: 'Kebijakan Perusahaan' },
                            { key: 'sopGRTT', label: 'SOP Usulan dan Persetujuan GRTT' },
                            { key: 'sopPADIATAPA', label: 'SOP Persetujuan Atas Dasar Informasi di Awal Tanpa Paksaan (PADIATAPA) & Pemetaan Partisipatif' },
                            { key: 'sopPenangananInformasi', label: 'SOP Penanganan Permintaan Informasi' },
                            { key: 'sopPenangananKeluhan', label: 'SOP Penangana Keluhan Stakeholder' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-blue-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder="Masukkan keterangan..."
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Kewajiban Plasma */}
                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold border-b pb-2">3.6 Kewajiban Pengembangan Plasma minimun 20 % dari Lahan yang di Usahakan</h4>
                          
                          {[
                            { key: 'mouKerjaSama', label: 'MoU Kerja sama' },
                            { key: 'skCPCL', label: 'SK CPCL (Calon Petani Calon Lahan)' },
                            { key: 'laporanRealisasiPlasma', label: 'Laporan Realisasi Plasma' }
                          ].map((item) => (
                            <Card key={item.key} className="bg-cyan-50">
                              <CardContent className="p-4">
                                <div className="space-y-4">
                                  <Label className="text-base font-medium">{item.label}</Label>
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-ya`}
                                        name={item.key}
                                        checked={supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: true }))}
                                      />
                                      <Label htmlFor={`${item.key}-ya`}>Ya</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id={`${item.key}-tidak`}
                                        name={item.key}
                                        checked={!(supplierComplianceForm[item.key as keyof typeof supplierComplianceForm] as boolean)}
                                        onChange={() => setSupplierComplianceForm(prev => ({ ...prev, [item.key]: false }))}
                                      />
                                      <Label htmlFor={`${item.key}-tidak`}>Tidak</Label>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Keterangan:</Label>
                                    <Input
                                      value={supplierComplianceForm[`${item.key}Keterangan` as keyof typeof supplierComplianceForm] as string}
                                      onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, [`${item.key}Keterangan`]: e.target.value }))}
                                      placeholder={item.key === 'laporanRealisasiPlasma' ? 'Dapat menggunakan Laporan SPUP' : 'Masukkan keterangan...'}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="space-y-4 bg-slate-100 p-4 rounded-lg">
                          <Label className="text-base font-semibold">3.7 Bukti Implementasi Point 3.5</Label>
                          <div className="space-y-2">
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'buktiImplementasi', 'supplier-compliance')}
                            >
                              <span>📁 Unggah Bukti Implementasi</span>
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        data-testid="button-submit-supplier-compliance"
                        className="w-full" 
                        disabled={createSupplierComplianceMutation.isPending}
                      >
                        {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hasil Koleksi Data</CardTitle>
                    <CardDescription>
                      Data yang telah dikumpulkan dari semua formulir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Estate Collections */}
                      {estateCollections.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data Estate ({estateCollections.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Supplier</TableHead>
                                  <TableHead>Alamat Kantor</TableHead>
                                  <TableHead>No. Telepon</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {estateCollections.map((collection) => (
                                  <TableRow key={collection.id}>
                                    <TableCell>{collection.namaSupplier || '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate">{collection.alamatKantor || '-'}</TableCell>
                                    <TableCell>{collection.nomorTelepon || '-'}</TableCell>
                                    <TableCell>{collection.emailKontak || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{collection.status || 'draft'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Mill Collections */}
                      {millCollections.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data Mill ({millCollections.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Supplier</TableHead>
                                  <TableHead>Kapasitas Produksi</TableHead>
                                  <TableHead>Jenis Produk</TableHead>
                                  <TableHead>Tahun Berdiri</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {millCollections.map((collection) => (
                                  <TableRow key={collection.id}>
                                    <TableCell>{collection.namaSupplier || '-'}</TableCell>
                                    <TableCell>{collection.kapasitasProduksi || 0} MT/hari</TableCell>
                                    <TableCell>{collection.jenisProduk || '-'}</TableCell>
                                    <TableCell>{collection.tahunBerdiri || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{collection.status || 'draft'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Traceability Collections */}
                      {traceabilityCollections.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data Traceability ({traceabilityCollections.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nomor DO</TableHead>
                                  <TableHead>Pemegang DO</TableHead>
                                  <TableHead>Alamat</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {traceabilityCollections.map((collection) => (
                                  <TableRow key={collection.id}>
                                    <TableCell>{collection.nomorDO || '-'}</TableCell>
                                    <TableCell>{collection.pemegangDO || '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate">{collection.alamatPemegangDO || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{collection.status || 'draft'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* KCP Collections */}
                      {kcpCollections.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data KCP ({kcpCollections.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama KCP</TableHead>
                                  <TableHead>Nama Group</TableHead>
                                  <TableHead>Kapasitas Olah</TableHead>
                                  <TableHead>Sistem Pencatatan</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {kcpCollections.map((collection) => (
                                  <TableRow key={collection.id}>
                                    <TableCell>{collection.namaKCP || '-'}</TableCell>
                                    <TableCell>{collection.namaGroup || '-'}</TableCell>
                                    <TableCell>{collection.kapasitasOlahMTHari || 0} MT/hari</TableCell>
                                    <TableCell>{collection.sistemPencatatan || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{collection.status || 'draft'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Bulking Collections */}
                      {bulkingCollections.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data Bulking ({bulkingCollections.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Fasilitas</TableHead>
                                  <TableHead>Nama Group</TableHead>
                                  <TableHead>Kapasitas Total</TableHead>
                                  <TableHead>Sistem Pencatatan</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {bulkingCollections.map((collection) => (
                                  <TableRow key={collection.id}>
                                    <TableCell>{collection.namaFasilitasBulking || '-'}</TableCell>
                                    <TableCell>{collection.namaGroup || '-'}</TableCell>
                                    <TableCell>{collection.kapasitasTotal || 0}</TableCell>
                                    <TableCell>{collection.sistemPencatatan || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{collection.status || 'draft'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Supplier Compliance Data */}
                      {dummySupplierComplianceData.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Data Kepatuhan Supplier ({dummySupplierComplianceData.length})</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nama Supplier</TableHead>
                                  <TableHead>Tingkat Kepatuhan</TableHead>
                                  <TableHead>Status Kepatuhan</TableHead>
                                  <TableHead>Tanggal Penilaian</TableHead>
                                  <TableHead>Kontak</TableHead>
                                  <TableHead>Aksi</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {dummySupplierComplianceData.map((compliance) => (
                                  <TableRow key={compliance.id}>
                                    <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <div className="w-12 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className={`h-2 rounded-full ${
                                              compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                              compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                          ></div>
                                        </div>
                                        <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                                        {compliance.statusKepatuhan}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{compliance.tanggalPenilaian}</TableCell>
                                    <TableCell className="text-sm">
                                      <div>{compliance.nomorTeleponTimInternal}</div>
                                      <div className="text-muted-foreground">{compliance.emailKontak}</div>
                                    </TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Estate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{estateCollections.length}</div>
                            <p className="text-xs text-muted-foreground">Data terkumpul</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total PKS</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{millCollections.length}</div>
                            <p className="text-xs text-muted-foreground">Data terkumpul</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Data Traceability</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{traceabilityCollections.length}</div>
                            <p className="text-xs text-muted-foreground">DO terdaftar</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Kepatuhan Rata-rata</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {Math.round(dummySupplierComplianceData.reduce((acc, item) => acc + item.tingkatKepatuhan, 0) / dummySupplierComplianceData.length)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Tingkat kepatuhan</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
    </div>
  );
}