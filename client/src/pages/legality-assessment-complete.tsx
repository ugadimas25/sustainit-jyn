import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, FileText, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { EstateDataCollection, MillDataCollection } from "@shared/schema";

// Estate Form Interface based on Indonesian document structure
interface EstateDataForm {
  // Bagian 1: Informasi Dasar
  namaPerusahaan?: string;
  nomorSertifikat?: string;
  lembagaSertifikasi?: string;
  ruangLingkupSertifikasi?: string;
  masaBerlakuSertifikat?: string;
  linkDokumen?: string;
  
  // Alamat & Koordinat
  alamatKantor?: string;
  alamatKebun?: string;
  koordinatKantor?: string;
  koordinatKebun?: string;
  
  // Jenis Supplier
  jenisSupplier?: string;
  totalProduksiTBS?: string;
  tanggalPengisianKuisioner?: string;
  
  // Penanggung Jawab
  namaPenanggungJawab?: string;
  jabatanPenanggungJawab?: string;
  emailPenanggungJawab?: string;
  nomorTeleponPenanggungJawab?: string;
  
  // Tim Internal
  namaTimInternal?: string;
  jabatanTimInternal?: string;
  emailTimInternal?: string;
  nomorTelefonTimInternal?: string;
  
  // Bagian 2: Sumber TBS
  sumberTBS: Array<{
    no: number;
    namaKebun: string;
    alamat: string;
    luasLahan: number;
    longitude: string;
    latitude: string;
    tahunTanam: string;
    jenisBibit: string;
    produksiTBS: number;
  }>;
  
  // Bagian 3: Perlindungan Hutan dan Gambut (with document uploads)
  memilikiKebijakanPerlindunganHutan?: boolean;
  keteranganKebijakanHutan?: string;
  dokumenKebijakanHutan?: string;
  
  mengikutiWorkshopNDPE?: boolean;
  keteranganWorkshopNDPE?: string;
  
  memilikiSOPKonservasi?: boolean;
  memilikiSOPPembukaanLahan?: boolean;
  keteranganSOP?: string;
  
  melakukanPenilaianNKT?: boolean;
  menyampaikanLaporanNKT?: boolean;
  keteranganNKT?: string;
  
  // Document uploads for all 'dokumen' fields
  dokumenSOPKonservasi?: string;
  dokumenSOPPembukaanLahan?: string;
  dokumenLaporanNKT?: string;
  
  // Bagian 4: Kepatuhan Hukum (with document uploads)
  memilikiIzinUsaha?: boolean;
  memilikiIzinLingkungan?: boolean;
  memilikiSertifikatHGU?: boolean;
  keteranganKepatuhan?: string;
  
  dokumenIzinUsaha?: string;
  dokumenIzinLingkungan?: string;
  dokumenSertifikatHGU?: string;
  
  // Bagian 5: Ketenagakerjaan (with document uploads)
  memilikiKebijakanTenagaKerja?: boolean;
  menerapkanStandarK3?: boolean;
  memberikanPelatihanK3?: boolean;
  keteranganKetenagakerjaan?: string;
  
  dokumenKebijakanTenagaKerja?: string;
  dokumenStandarK3?: string;
  dokumenPelatihanK3?: string;
  
  // Additional fields for comprehensive data collection
  statusVerifikasi?: 'pending' | 'approved' | 'rejected';
  catatanReviewer?: string;
  tanggalSubmit?: string;
}

// Mill Form Interface based on Indonesian document structure  
interface MillDataForm {
  // Bagian 1: Informasi Pabrik
  namaPabrik?: string;
  kodePabrik?: string;
  alamatPabrik?: string;
  koordinatPabrik?: string;
  kapasitasOlahTBS?: string;
  tahunBerdiri?: string;
  
  // Sertifikasi dan Izin
  nomorSertifikatRSPO?: string;
  nomorSertifikatISCC?: string;
  nomorIzinOperasi?: string;
  masaBerlakuOperasi?: string;
  
  // Dokumen Sertifikasi dan Izin
  dokumenSertifikatRSPO?: string;
  dokumenSertifikatISCC?: string;
  dokumenIzinOperasi?: string;
  
  // Bagian 2: Sumber TBS Pabrik
  sumberTBSPabrik: Array<{
    no: number;
    namaSupplier: string;
    jenisSupplier: string;
    alamat: string;
    koordinat: string;
    kapasitasSupply: number;
    jenisSertifikat: string;
  }>;
  
  // Bagian 3: Proses Produksi
  jenisTeknologi?: string;
  kapasitasHarian?: string;
  rendemenCPO?: string;
  rendemenPalmKernel?: string;
  
  // Bagian 4: Pengelolaan Limbah (with document uploads)
  memilikiInstalasiPengolahLimbah?: boolean;
  jenisIPAL?: string;
  kapasitasIPAL?: string;
  dokumenIPAL?: string;
  
  menerapkanZeroWaste?: boolean;
  pemanfaatanCPOS?: string;
  dokumenZeroWaste?: string;
  
  // Bagian 5: Kepatuhan Lingkungan (with document uploads)
  memilikiAMDAL?: boolean;
  memilikiUKLUPL?: boolean;
  memilikiSPPL?: string;
  keteranganLingkungan?: string;
  
  dokumenAMDAL?: string;
  dokumenUKLUPL?: string;
  dokumenSPPL?: string;
  
  // Bagian 6: Sistem Manajemen Mutu (with document uploads)
  menerapkanISO9001?: boolean;
  menerapkanISO14001?: boolean;
  menerapkanOHSAS18001?: boolean;
  keteranganSistemManajemen?: string;
  
  dokumenISO9001?: string;
  dokumenISO14001?: string;
  dokumenOHSAS18001?: string;
  
  // Penanggung Jawab Mill
  namaPenanggungJawabMill?: string;
  jabatanPenanggungJawabMill?: string;
  emailPenanggungJawabMill?: string;
  nomorTeleponPenanggungJawabMill?: string;
  
  // Status dan metadata
  statusVerifikasi?: 'pending' | 'approved' | 'rejected';
  catatanReviewer?: string;
  tanggalSubmit?: string;
}

export default function LegalityAssessmentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("estate");
  
  // Estate form state
  const [estateForm, setEstateForm] = useState<EstateDataForm>({
    sumberTBS: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      luasLahan: 0,
      longitude: '',
      latitude: '',
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS: 0
    }]
  });

  // Mill form state
  const [millForm, setMillForm] = useState<MillDataForm>({
    sumberTBSPabrik: [{
      no: 1,
      namaSupplier: '',
      jenisSupplier: '',
      alamat: '',
      koordinat: '',
      kapasitasSupply: 0,
      jenisSertifikat: ''
    }]
  });

  // Fetch existing data collections
  const { data: estateCollections = [] } = useQuery<EstateDataCollection[]>({
    queryKey: ['/api/estate-data-collection'],
  });

  const { data: millCollections = [] } = useQuery<MillDataCollection[]>({
    queryKey: ['/api/mill-data-collection'],
  });

  const { data: traceabilityCollections = [] } = useQuery({
    queryKey: ['/api/traceability-data-collection'],
  });

  const { data: kcpCollections = [] } = useQuery({
    queryKey: ['/api/kcp-data-collection'],
  });

  const { data: bulkingCollections = [] } = useQuery({
    queryKey: ['/api/bulking-data-collection'],
  });

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/estate-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      toast({
        title: "Estate Data Collection berhasil disimpan",
        description: "Data koleksi estate telah berhasil disimpan ke database.",
      });
      // Reset form
      setEstateForm({
        sumberTBS: [{
          no: 1,
          namaKebun: '',
          alamat: '',
          luasLahan: 0,
          longitude: '',
          latitude: '',
          tahunTanam: '',
          jenisBibit: '',
          produksiTBS: 0
        }]
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan data",
        description: "Terjadi kesalahan saat menyimpan data estate collection.",
        variant: "destructive",
      });
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Mill Data Collection berhasil disimpan",
        description: "Data koleksi mill telah berhasil disimpan ke database.",
      });
      // Reset form
      setMillForm({
        sumberTBSPabrik: [{
          no: 1,
          namaSupplier: '',
          jenisSupplier: '',
          alamat: '',
          koordinat: '',
          kapasitasSupply: 0,
          jenisSertifikat: ''
        }]
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal menyimpan data",
        description: "Terjadi kesalahan saat menyimpan data mill collection.",
        variant: "destructive",
      });
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
    formType: 'estate' | 'mill'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      // Extract object path from the upload URL
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  // Helper functions for dynamic form rows
  const addSumberTBS = () => {
    const newEntry = {
      no: estateForm.sumberTBS.length + 1,
      namaKebun: '',
      alamat: '',
      luasLahan: 0,
      longitude: '',
      latitude: '',
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS: 0
    };
    setEstateForm(prev => ({ ...prev, sumberTBS: [...prev.sumberTBS, newEntry] }));
  };

  const removeSumberTBS = (index: number) => {
    if (estateForm.sumberTBS.length > 1) {
      setEstateForm(prev => ({
        ...prev,
        sumberTBS: prev.sumberTBS.filter((_, i) => i !== index)
      }));
    }
  };

  const addSumberTBSPabrik = () => {
    const newEntry = {
      no: millForm.sumberTBSPabrik.length + 1,
      namaSupplier: '',
      jenisSupplier: '',
      alamat: '',
      koordinat: '',
      kapasitasSupply: 0,
      jenisSertifikat: ''
    };
    setMillForm(prev => ({ ...prev, sumberTBSPabrik: [...prev.sumberTBSPabrik, newEntry] }));
  };

  const removeSumberTBSPabrik = (index: number) => {
    if (millForm.sumberTBSPabrik.length > 1) {
      setMillForm(prev => ({
        ...prev,
        sumberTBSPabrik: prev.sumberTBSPabrik.filter((_, i) => i !== index)
      }));
    }
  };

  // Form submission handlers
  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...estateForm,
      tanggalSubmit: new Date().toISOString(),
      statusVerifikasi: 'pending' as const,
    };
    createEstateMutation.mutate(submissionData);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = {
      ...millForm,
      tanggalSubmit: new Date().toISOString(),
      statusVerifikasi: 'pending' as const,
    };
    createMillMutation.mutate(submissionData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Legality Assessment</h1>
        <p className="text-muted-foreground">
          Platform penilaian legalitas komprehensif untuk Estate dan Mill dengan sistem unggah dokumen terintegrasi
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="estate" data-testid="tab-estate">Estate Data Collection</TabsTrigger>
          <TabsTrigger value="mill" data-testid="tab-mill">Mill Data Collection</TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results">Hasil Pengumpulan Data</TabsTrigger>
        </TabsList>

        {/* Estate Data Collection Tab */}
        <TabsContent value="estate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulir Data Collection Estate</CardTitle>
              <CardDescription>
                Formulir pengumpulan data komprehensif untuk Estate dengan sistem unggah dokumen yang terintegrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEstateSubmit} className="space-y-8">
                {/* Bagian 1: Informasi Dasar */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Dasar</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama-perusahaan">Nama Perusahaan</Label>
                      <Input 
                        id="nama-perusahaan" 
                        placeholder="Nama lengkap perusahaan" 
                        value={estateForm.namaPerusahaan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaPerusahaan: e.target.value }))}
                        data-testid="input-nama-perusahaan" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomor-sertifikat">Nomor Sertifikat</Label>
                      <Input 
                        id="nomor-sertifikat" 
                        placeholder="Nomor sertifikat resmi" 
                        value={estateForm.nomorSertifikat || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, nomorSertifikat: e.target.value }))}
                        data-testid="input-nomor-sertifikat" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lembaga-sertifikasi">Lembaga Sertifikasi</Label>
                      <Input 
                        id="lembaga-sertifikasi" 
                        placeholder="Nama lembaga sertifikasi" 
                        value={estateForm.lembagaSertifikasi || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, lembagaSertifikasi: e.target.value }))}
                        data-testid="input-lembaga-sertifikasi" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ruang-lingkup">Ruang Lingkup Sertifikasi</Label>
                      <Input 
                        id="ruang-lingkup" 
                        placeholder="Ruang lingkup sertifikasi" 
                        value={estateForm.ruangLingkupSertifikasi || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, ruangLingkupSertifikasi: e.target.value }))}
                        data-testid="input-ruang-lingkup" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="masa-berlaku">Masa Berlaku Sertifikat</Label>
                      <Input 
                        id="masa-berlaku" 
                        type="date" 
                        value={estateForm.masaBerlakuSertifikat || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, masaBerlakuSertifikat: e.target.value }))}
                        data-testid="input-masa-berlaku" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Bagian 3: Perlindungan Hutan dan Gambut dengan Upload Dokumen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 3 – Perlindungan Hutan dan Gambut</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="kebijakan-hutan"
                        checked={estateForm.memilikiKebijakanPerlindunganHutan}
                        onCheckedChange={(checked) => 
                          setEstateForm(prev => ({ ...prev, memilikiKebijakanPerlindunganHutan: !!checked }))
                        }
                        data-testid="checkbox-kebijakan-hutan" 
                      />
                      <Label htmlFor="kebijakan-hutan">Memiliki kebijakan perlindungan hutan dan gambut</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keterangan-hutan">Keterangan Kebijakan Hutan</Label>
                      <Textarea 
                        id="keterangan-hutan" 
                        placeholder="Jelaskan kebijakan perlindungan hutan yang dimiliki" 
                        value={estateForm.keteranganKebijakanHutan || ""}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, keteranganKebijakanHutan: e.target.value }))}
                        data-testid="textarea-keterangan-hutan"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dokumen Kebijakan Perlindungan Hutan</Label>
                      <div className="flex items-center gap-2">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenKebijakanHutan', 'estate')}
                          buttonClassName="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Dokumen
                        </ObjectUploader>
                        {estateForm.dokumenKebijakanHutan && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <FileText className="h-4 w-4" />
                            Dokumen terunggah
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="sop-konservasi"
                        checked={estateForm.memilikiSOPKonservasi}
                        onCheckedChange={(checked) => 
                          setEstateForm(prev => ({ ...prev, memilikiSOPKonservasi: !!checked }))
                        }
                        data-testid="checkbox-sop-konservasi" 
                      />
                      <Label htmlFor="sop-konservasi">Memiliki SOP konservasi biodiversitas</Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Dokumen SOP Konservasi</Label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenSOPKonservasi', 'estate')}
                        buttonClassName="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Dokumen SOP
                      </ObjectUploader>
                      {estateForm.dokumenSOPKonservasi && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <FileText className="h-4 w-4" />
                          Dokumen SOP Konservasi terunggah
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Bagian 4: Kepatuhan Hukum dengan Upload Dokumen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 4 – Kepatuhan Hukum</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="izin-usaha"
                          checked={estateForm.memilikiIzinUsaha}
                          onCheckedChange={(checked) => 
                            setEstateForm(prev => ({ ...prev, memilikiIzinUsaha: !!checked }))
                          }
                          data-testid="checkbox-izin-usaha" 
                        />
                        <Label htmlFor="izin-usaha">Izin Usaha</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="izin-lingkungan"
                          checked={estateForm.memilikiIzinLingkungan}
                          onCheckedChange={(checked) => 
                            setEstateForm(prev => ({ ...prev, memilikiIzinLingkungan: !!checked }))
                          }
                          data-testid="checkbox-izin-lingkungan" 
                        />
                        <Label htmlFor="izin-lingkungan">Izin Lingkungan</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="sertifikat-hgu"
                          checked={estateForm.memilikiSertifikatHGU}
                          onCheckedChange={(checked) => 
                            setEstateForm(prev => ({ ...prev, memilikiSertifikatHGU: !!checked }))
                          }
                          data-testid="checkbox-sertifikat-hgu" 
                        />
                        <Label htmlFor="sertifikat-hgu">Sertifikat HGU</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Dokumen Izin Usaha</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenIzinUsaha', 'estate')}
                          buttonClassName="flex items-center gap-2 w-full justify-center"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </ObjectUploader>
                        {estateForm.dokumenIzinUsaha && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Terunggah
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Dokumen Izin Lingkungan</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenIzinLingkungan', 'estate')}
                          buttonClassName="flex items-center gap-2 w-full justify-center"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </ObjectUploader>
                        {estateForm.dokumenIzinLingkungan && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Terunggah
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Dokumen Sertifikat HGU</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenSertifikatHGU', 'estate')}
                          buttonClassName="flex items-center gap-2 w-full justify-center"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </ObjectUploader>
                        {estateForm.dokumenSertifikatHGU && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Terunggah
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={createEstateMutation.isPending}
                    className="px-8"
                    data-testid="button-submit-estate"
                  >
                    {createEstateMutation.isPending ? "Menyimpan..." : "Simpan Estate Data Collection"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mill Data Collection Tab */}
        <TabsContent value="mill" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Formulir Data Collection Mill</CardTitle>
              <CardDescription>
                Formulir pengumpulan data komprehensif untuk Mill dengan sistem unggah dokumen yang terintegrasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMillSubmit} className="space-y-8">
                {/* Bagian 1: Informasi Pabrik */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Pabrik</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama-pabrik">Nama Pabrik</Label>
                      <Input 
                        id="nama-pabrik" 
                        placeholder="Nama lengkap pabrik" 
                        value={millForm.namaPabrik || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                        data-testid="input-nama-pabrik" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kode-pabrik">Kode Pabrik</Label>
                      <Input 
                        id="kode-pabrik" 
                        placeholder="Kode identifikasi pabrik" 
                        value={millForm.kodePabrik || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kodePabrik: e.target.value }))}
                        data-testid="input-kode-pabrik" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alamat-pabrik">Alamat Pabrik</Label>
                      <Textarea 
                        id="alamat-pabrik" 
                        placeholder="Alamat lengkap pabrik" 
                        value={millForm.alamatPabrik || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, alamatPabrik: e.target.value }))}
                        data-testid="textarea-alamat-pabrik"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="koordinat-pabrik">Koordinat Pabrik</Label>
                      <Input 
                        id="koordinat-pabrik" 
                        placeholder="Latitude, Longitude" 
                        value={millForm.koordinatPabrik || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, koordinatPabrik: e.target.value }))}
                        data-testid="input-koordinat-pabrik" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kapasitas-olah">Kapasitas Olah TBS (Ton/Jam)</Label>
                      <Input 
                        id="kapasitas-olah" 
                        type="number"
                        placeholder="Kapasitas pengolahan TBS" 
                        value={millForm.kapasitasOlahTBS || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kapasitasOlahTBS: e.target.value }))}
                        data-testid="input-kapasitas-olah" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tahun-berdiri">Tahun Berdiri</Label>
                      <Input 
                        id="tahun-berdiri" 
                        type="number"
                        placeholder="Tahun pendirian pabrik" 
                        value={millForm.tahunBerdiri || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, tahunBerdiri: e.target.value }))}
                        data-testid="input-tahun-berdiri" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kapasitas-harian">Kapasitas Harian (Ton/Hari)</Label>
                      <Input 
                        id="kapasitas-harian" 
                        placeholder="Kapasitas produksi harian" 
                        value={millForm.kapasitasHarian || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kapasitasHarian: e.target.value }))}
                        data-testid="input-kapasitas-harian" 
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sertifikasi dan Dokumen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Sertifikasi dan Izin Operasi</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rspo-cert">Nomor Sertifikat RSPO</Label>
                      <Input 
                        id="rspo-cert" 
                        placeholder="Nomor sertifikat RSPO" 
                        value={millForm.nomorSertifikatRSPO || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, nomorSertifikatRSPO: e.target.value }))}
                        data-testid="input-rspo-cert" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iscc-cert">Nomor Sertifikat ISCC</Label>
                      <Input 
                        id="iscc-cert" 
                        placeholder="Nomor sertifikat ISCC" 
                        value={millForm.nomorSertifikatISCC || ""}
                        onChange={(e) => setMillForm(prev => ({ ...prev, nomorSertifikatISCC: e.target.value }))}
                        data-testid="input-iscc-cert" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Dokumen RSPO</Label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenSertifikatRSPO', 'mill')}
                        buttonClassName="flex items-center gap-2 w-full justify-center"
                      >
                        <Upload className="h-4 w-4" />
                        Upload RSPO
                      </ObjectUploader>
                      {millForm.dokumenSertifikatRSPO && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Terunggah
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dokumen ISCC</Label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenSertifikatISCC', 'mill')}
                        buttonClassName="flex items-center gap-2 w-full justify-center"
                      >
                        <Upload className="h-4 w-4" />
                        Upload ISCC
                      </ObjectUploader>
                      {millForm.dokumenSertifikatISCC && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Terunggah
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Dokumen Izin Operasi</Label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenIzinOperasi', 'mill')}
                        buttonClassName="flex items-center gap-2 w-full justify-center"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Izin
                      </ObjectUploader>
                      {millForm.dokumenIzinOperasi && (
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Terunggah
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pengelolaan Limbah dengan Dokumen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Pengelolaan Limbah</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ipal"
                        checked={millForm.memilikiInstalasiPengolahLimbah}
                        onCheckedChange={(checked) => 
                          setMillForm(prev => ({ ...prev, memilikiInstalasiPengolahLimbah: !!checked }))
                        }
                        data-testid="checkbox-ipal" 
                      />
                      <Label htmlFor="ipal">Memiliki Instalasi Pengolah Air Limbah (IPAL)</Label>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jenis-ipal">Jenis IPAL</Label>
                        <Select value={millForm.jenisIPAL} onValueChange={(value) => setMillForm(prev => ({ ...prev, jenisIPAL: value }))}>
                          <SelectTrigger data-testid="select-jenis-ipal">
                            <SelectValue placeholder="Pilih jenis IPAL" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lagoon">Lagoon System</SelectItem>
                            <SelectItem value="anaerobic">Anaerobic Digester</SelectItem>
                            <SelectItem value="biogas">Biogas Plant</SelectItem>
                            <SelectItem value="lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="kapasitas-ipal">Kapasitas IPAL (m³/hari)</Label>
                        <Input 
                          id="kapasitas-ipal" 
                          placeholder="Kapasitas pengolahan IPAL" 
                          value={millForm.kapasitasIPAL || ""}
                          onChange={(e) => setMillForm(prev => ({ ...prev, kapasitasIPAL: e.target.value }))}
                          data-testid="input-kapasitas-ipal" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dokumen IPAL</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenIPAL', 'mill')}
                          buttonClassName="flex items-center gap-2 w-full justify-center"
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </ObjectUploader>
                        {millForm.dokumenIPAL && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Terunggah
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="zero-waste"
                        checked={millForm.menerapkanZeroWaste}
                        onCheckedChange={(checked) => 
                          setMillForm(prev => ({ ...prev, menerapkanZeroWaste: !!checked }))
                        }
                        data-testid="checkbox-zero-waste" 
                      />
                      <Label htmlFor="zero-waste">Menerapkan konsep Zero Waste</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pemanfaatan-cpos">Pemanfaatan CPOS dan Limbah Cair</Label>
                        <Textarea 
                          id="pemanfaatan-cpos" 
                          placeholder="Jelaskan pemanfaatan CPOS dan limbah cair" 
                          value={millForm.pemanfaatanCPOS || ""}
                          onChange={(e) => setMillForm(prev => ({ ...prev, pemanfaatanCPOS: e.target.value }))}
                          data-testid="textarea-pemanfaatan-cpos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Dokumen Zero Waste</Label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result) => handleDocumentUploadComplete(result, 'dokumenZeroWaste', 'mill')}
                          buttonClassName="flex items-center gap-2 w-full justify-center"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Dokumen
                        </ObjectUploader>
                        {millForm.dokumenZeroWaste && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Terunggah
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <Button 
                    type="submit" 
                    disabled={createMillMutation.isPending}
                    className="px-8"
                    data-testid="button-submit-mill"
                  >
                    {createMillMutation.isPending ? "Menyimpan..." : "Simpan Mill Data Collection"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab - Data Collection Results */}
        <TabsContent value="results" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estate Data Collection Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Estate Data Collections
                </CardTitle>
                <CardDescription>
                  Hasil pengumpulan data Estate ({estateCollections.length} entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Perusahaan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estateCollections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            Belum ada data Estate collection
                          </TableCell>
                        </TableRow>
                      ) : (
                        estateCollections.map((estate: any) => (
                          <TableRow key={estate.id}>
                            <TableCell className="font-medium">
                              {estate.namaPerusahaan || "Tidak disebutkan"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                estate.statusVerifikasi === 'approved' ? 'default' :
                                estate.statusVerifikasi === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {estate.statusVerifikasi || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {estate.tanggalSubmit ? new Date(estate.tanggalSubmit).toLocaleDateString('id-ID') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" data-testid={`button-view-estate-${estate.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mill Data Collection Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mill Data Collections
                </CardTitle>
                <CardDescription>
                  Hasil pengumpulan data Mill ({millCollections.length} entries)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Pabrik</TableHead>
                        <TableHead>Kode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {millCollections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Belum ada data Mill collection
                          </TableCell>
                        </TableRow>
                      ) : (
                        millCollections.map((mill: any) => (
                          <TableRow key={mill.id}>
                            <TableCell className="font-medium">
                              {mill.namaPabrik || "Tidak disebutkan"}
                            </TableCell>
                            <TableCell>
                              {mill.kodePabrik || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                mill.statusVerifikasi === 'approved' ? 'default' :
                                mill.statusVerifikasi === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {mill.statusVerifikasi || 'pending'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {mill.tanggalSubmit ? new Date(mill.tanggalSubmit).toLocaleDateString('id-ID') : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" data-testid={`button-view-mill-${mill.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Data Collection</CardTitle>
              <CardDescription>
                Statistik dan ringkasan pengumpulan data Estate dan Mill
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{estateCollections.length}</div>
                  <div className="text-sm text-muted-foreground">Total Estate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{millCollections.length}</div>
                  <div className="text-sm text-muted-foreground">Total Mill</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {estateCollections.filter((e: any) => e.statusVerifikasi === 'pending').length + 
                     millCollections.filter((m: any) => m.statusVerifikasi === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {estateCollections.filter((e: any) => e.statusVerifikasi === 'approved').length + 
                     millCollections.filter((m: any) => m.statusVerifikasi === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}